"""
Security + permission regression tests. Run from backend/ with:

    python manage.py test core

They cover the launch blockers found in the November 2026 audit: who may
write what, offering confirmation, the give-form flow and account hygiene.
"""
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import User
from content.models import Announcement, Group
from dioceses.models import Diocese, Parish
from offerings.models import Campaign, Offering

PW = "Str0ng-pass-123"


@override_settings(SECURE_SSL_REDIRECT=False)
class BaseCase(APITestCase):
    def setUp(self):
        cache.clear()  # throttle counters live in the cache
        self.diocese = Diocese.objects.create(name="Byumba", slug="byumba")
        self.other_diocese = Diocese.objects.create(name="Other", slug="other")
        self.p1 = Parish.objects.create(diocese=self.diocese, name="Kibali", slug="kibali")
        self.p2 = Parish.objects.create(diocese=self.diocese, name="Rugandu", slug="rugandu")
        self.g1 = Group.objects.create(parish=self.p1, group_type="CHOIR", name="Choir 1")
        self.g1b = Group.objects.create(parish=self.p1, group_type="YOUTH_UNION", name="Youth 1")
        self.g2 = Group.objects.create(parish=self.p2, group_type="CHOIR", name="Choir 2")

        self.super = self._user("super", "SUPER_ADMIN")
        self.dioc_admin = self._user("dioc", "DIOCESE_ADMIN", diocese=self.diocese)
        self.admin1 = self._user("admin1", "PARISH_ADMIN", parish=self.p1, diocese=self.diocese)
        self.leader1 = self._user("leader1", "GROUP_LEADER", parish=self.p1, group=self.g1)
        self.alice = self._user("alice", "MEMBER", parish=self.p1)
        self.bob = self._user("bob", "MEMBER", parish=self.p2)

    def _user(self, username, role, **kw):
        return User.objects.create_user(
            username, password=PW, role=role, email=f"{username}@example.com", **kw
        )

    def as_user(self, user):
        c = self.client_class()
        r = c.post("/api/auth/login/", {"username": user.username, "password": PW}, format="json")
        c.credentials(HTTP_AUTHORIZATION="Bearer " + r.data["access"])
        return c

    def ann(self, parish, **extra):
        return {"diocese": self.diocese.id, "parish": parish.id if parish else None,
                "title_en": "Hello", "body_en": "Body", **extra}


class ParishAndContentPermissions(BaseCase):
    def test_anonymous_cannot_create_parish(self):
        r = self.client.post("/api/dioceses/parishes/",
                             {"diocese": self.diocese.id, "name": "Spam", "slug": "spam"}, format="json")
        self.assertIn(r.status_code, (401, 403))
        self.assertFalse(Parish.objects.filter(slug="spam").exists())

    def test_member_cannot_create_parish_or_content(self):
        c = self.as_user(self.alice)
        self.assertEqual(c.post("/api/dioceses/parishes/", {"diocese": self.diocese.id, "name": "X", "slug": "x"}, format="json").status_code, 403)
        self.assertEqual(c.post("/api/content/announcements/", self.ann(self.p1), format="json").status_code, 403)
        self.assertEqual(c.post("/api/content/sermons/", {"diocese": self.diocese.id, "title": "t", "date_preached": "2026-01-01"}, format="json").status_code, 403)
        self.assertEqual(c.delete(f"/api/content/groups/{self.g2.id}/").status_code, 403)
        self.assertTrue(Group.objects.filter(id=self.g2.id).exists())

    def test_public_can_still_read(self):
        for url in ("/api/dioceses/parishes/", "/api/content/groups/", "/api/content/announcements/",
                    "/api/content/events/", "/api/content/sermons/", "/api/offerings/campaigns/",
                    "/api/dioceses/dioceses/", "/api/dioceses/clergy/"):
            self.assertEqual(self.client.get(url).status_code, 200, url)

    def test_parish_admin_scope(self):
        c = self.as_user(self.admin1)
        self.assertEqual(c.post("/api/content/announcements/", self.ann(self.p1), format="json").status_code, 201)
        # other parish, and a diocese-wide post, are both refused
        self.assertEqual(c.post("/api/content/announcements/", self.ann(self.p2), format="json").status_code, 403)
        self.assertEqual(c.post("/api/content/announcements/", self.ann(None), format="json").status_code, 403)
        # cannot delete or move another parish's records
        self.assertEqual(c.delete(f"/api/content/groups/{self.g2.id}/").status_code, 403)
        own = Announcement.objects.get(parish=self.p1)
        r = c.patch(f"/api/content/announcements/{own.id}/", {"parish": self.p2.id}, format="json")
        self.assertEqual(r.status_code, 403)
        # own group management works
        self.assertEqual(c.post("/api/content/group-members/", {"group": self.g1.id, "name": "Jean"}, format="json").status_code, 201)
        self.assertEqual(c.post("/api/content/group-members/", {"group": self.g2.id, "name": "Jean"}, format="json").status_code, 403)

    def test_parish_admin_can_edit_own_parish_only(self):
        c = self.as_user(self.admin1)
        self.assertEqual(c.patch(f"/api/dioceses/parishes/{self.p1.id}/", {"location": "Byumba"}, format="json").status_code, 200)
        self.assertEqual(c.patch(f"/api/dioceses/parishes/{self.p2.id}/", {"location": "Hack"}, format="json").status_code, 403)
        self.assertEqual(c.delete(f"/api/dioceses/parishes/{self.p1.id}/").status_code, 403)
        self.assertEqual(c.patch(f"/api/dioceses/parishes/{self.p1.id}/", {"diocese": self.other_diocese.id}, format="json").status_code, 403)

    def test_diocese_admin_scope(self):
        c = self.as_user(self.dioc_admin)
        self.assertEqual(c.post("/api/content/announcements/", self.ann(None), format="json").status_code, 201)
        self.assertEqual(c.post("/api/content/announcements/", self.ann(self.p2), format="json").status_code, 201)
        self.assertEqual(c.post("/api/dioceses/parishes/", {"diocese": self.diocese.id, "name": "New", "slug": "new"}, format="json").status_code, 201)
        # not another diocese, and cannot create or delete a whole diocese
        self.assertEqual(c.post("/api/dioceses/parishes/", {"diocese": self.other_diocese.id, "name": "Nope", "slug": "nope"}, format="json").status_code, 403)
        self.assertEqual(c.delete(f"/api/dioceses/dioceses/{self.diocese.id}/").status_code, 403)
        self.assertEqual(c.patch(f"/api/dioceses/dioceses/{self.other_diocese.id}/", {"bishop_name": "x"}, format="json").status_code, 403)
        self.assertEqual(c.patch(f"/api/dioceses/dioceses/{self.diocese.id}/", {"bishop_name": "Rt Rev"}, format="json").status_code, 200)

    def test_group_leader_only_own_group(self):
        c = self.as_user(self.leader1)
        self.assertEqual(c.post("/api/content/songs/", {"group": self.g1.id, "title": "Song"}, format="json").status_code, 201)
        self.assertEqual(c.post("/api/content/songs/", {"group": self.g1b.id, "title": "Song"}, format="json").status_code, 403)
        self.assertEqual(c.post("/api/content/songs/", {"group": self.g2.id, "title": "Song"}, format="json").status_code, 403)
        self.assertEqual(c.post("/api/content/announcements/", self.ann(self.p1, group=self.g1.id), format="json").status_code, 201)
        self.assertEqual(c.post("/api/content/announcements/", self.ann(self.p1), format="json").status_code, 403)  # no group
        self.assertEqual(c.post("/api/content/groups/", {"parish": self.p1.id, "group_type": "CHOIR", "name": "New"}, format="json").status_code, 403)

    def test_campaign_scope(self):
        base = {"diocese": self.diocese.id, "title": "T", "target_amount_rwf": "1000", "start_date": "2026-01-01"}
        c = self.as_user(self.admin1)
        self.assertEqual(c.post("/api/offerings/campaigns/", {**base, "parish": self.p1.id}, format="json").status_code, 201)
        self.assertEqual(c.post("/api/offerings/campaigns/", {**base, "parish": self.p2.id}, format="json").status_code, 403)
        self.assertEqual(c.post("/api/offerings/campaigns/", {**base, "parish": None}, format="json").status_code, 403)
        wide = Campaign.objects.create(diocese=self.diocese, title="Wide", target_amount_rwf=1, start_date="2026-01-01")
        self.assertEqual(c.patch(f"/api/offerings/campaigns/{wide.id}/", {"is_active": False}, format="json").status_code, 403)
        self.assertEqual(self.as_user(self.alice).post("/api/offerings/campaigns/", {**base, "parish": self.p1.id}, format="json").status_code, 403)


class OfferingFlow(BaseCase):
    def setUp(self):
        super().setUp()
        self.wide = Campaign.objects.create(diocese=self.diocese, title="Diocese wide", target_amount_rwf=1_000_000, start_date="2026-01-01")
        self.local = Campaign.objects.create(diocese=self.diocese, parish=self.p2, title="Rugandu roof", target_amount_rwf=500_000, start_date="2026-01-01")

    def give(self, client, campaign, amount="1000", **extra):
        return client.post("/api/offerings/", {"campaign": campaign.id, "amount_rwf": amount, "purpose": "OTHER",
                                               "method": "MTN_MOMO", "date_given": "2026-02-01", **extra}, format="json")

    def test_member_gift_to_diocese_wide_campaign_is_pending_and_attributed(self):
        c = self.as_user(self.alice)
        r = self.give(c, self.wide)
        self.assertEqual(r.status_code, 201, r.data)
        o = Offering.objects.get(id=r.data["id"])
        self.assertEqual((o.member_id, o.parish_id, o.status), (self.alice.id, self.p1.id, "PENDING"))
        self.assertEqual(len(c.get("/api/offerings/").data), 1)  # shows in "My contributions"

    def test_member_cannot_spoof_parish_member_status_or_edit(self):
        c = self.as_user(self.alice)
        r = self.give(c, self.wide, parish=self.p2.id, member=self.bob.id, status="CONFIRMED")
        o = Offering.objects.get(id=r.data["id"])
        self.assertEqual((o.member_id, o.parish_id, o.status), (self.alice.id, self.p1.id, "PENDING"))
        self.assertEqual(c.patch(f"/api/offerings/{o.id}/", {"amount_rwf": "1"}, format="json").status_code, 403)
        self.assertEqual(c.delete(f"/api/offerings/{o.id}/").status_code, 403)
        self.assertEqual(c.post(f"/api/offerings/{o.id}/confirm/").status_code, 403)

    def test_parish_campaign_gift_goes_to_that_campaigns_parish(self):
        r = self.give(self.as_user(self.alice), self.local)
        self.assertEqual(Offering.objects.get(id=r.data["id"]).parish_id, self.p2.id)

    def test_closed_campaign_and_bad_amounts_rejected(self):
        c = self.as_user(self.alice)
        self.wide.is_active = False
        self.wide.save()
        self.assertEqual(self.give(c, self.wide).status_code, 400)
        self.assertEqual(self.give(c, self.local, amount="0").status_code, 400)
        self.assertEqual(self.give(c, self.local, amount="-5").status_code, 400)

    def test_pending_gifts_do_not_count_until_confirmed(self):
        r = self.give(self.as_user(self.alice), self.wide, amount="999999999")
        self.assertEqual(self.client.get("/api/offerings/campaigns/").data[0]["raised_amount_rwf"], 0)
        admin = self.as_user(self.admin1)
        t = admin.get("/api/offerings/totals/").data
        self.assertEqual((t["grand_total_rwf"], t["pending_count"]), (0, 1))
        self.assertEqual(admin.post(f"/api/offerings/{r.data['id']}/confirm/").status_code, 200)
        raised = {c["title"]: c["raised_amount_rwf"] for c in self.client.get("/api/offerings/campaigns/").data}
        self.assertEqual(raised["Diocese wide"], 999999999)
        self.assertEqual(admin.get("/api/offerings/totals/").data["pending_count"], 0)

    def test_admin_scope_on_offerings(self):
        r = self.give(self.as_user(self.bob), self.wide)  # bob's gift belongs to parish 2
        oid = r.data["id"]
        self.assertEqual(self.as_user(self.admin1).post(f"/api/offerings/{oid}/confirm/").status_code, 404)  # not in scope
        self.assertEqual(self.as_user(self.dioc_admin).post(f"/api/offerings/{oid}/confirm/").status_code, 200)

    def test_admin_logged_gift_is_confirmed_and_checked(self):
        c = self.as_user(self.admin1)
        base = {"amount_rwf": "5000", "purpose": "TITHE", "method": "CASH", "date_given": "2026-02-01"}
        r = c.post("/api/offerings/", {**base, "parish": self.p1.id, "member": self.alice.id}, format="json")
        self.assertEqual((r.status_code, r.data["status"]), (201, "CONFIRMED"))
        self.assertEqual(c.post("/api/offerings/", {**base, "parish": self.p2.id}, format="json").status_code, 403)
        self.assertEqual(c.post("/api/offerings/", {**base, "parish": self.p1.id, "member": self.bob.id}, format="json").status_code, 400)
        self.assertEqual(c.post("/api/offerings/", base, format="json").status_code, 400)  # parish missing

    def test_members_never_see_each_others_gifts(self):
        self.give(self.as_user(self.bob), self.wide)
        self.assertEqual(self.as_user(self.alice).get("/api/offerings/").data, [])


class AccountHygiene(BaseCase):
    def register(self, username, email, **extra):
        return self.client.post("/api/accounts/register/", {
            "username": username, "email": email, "password": "Zebra-Quartz-81", "first_name": "A",
            "last_name": "B", "parish": self.p1.id, **extra}, format="json")

    def test_registration_requires_unique_email_and_parish(self):
        self.assertEqual(self.register("new1", "same@example.com").status_code, 201)
        self.assertEqual(self.register("new2", "SAME@example.com").status_code, 400)
        self.assertEqual(self.register("new3", "").status_code, 400)
        r = self.client.post("/api/accounts/register/", {"username": "n4", "email": "n4@e.com", "password": "Zebra-Quartz-81"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_registration_always_creates_plain_member(self):
        r = self.register("sneaky", "sneaky@example.com", role="SUPER_ADMIN", is_staff=True)
        u = User.objects.get(id=r.data["id"])
        self.assertEqual((u.role, u.is_staff, u.is_superuser), ("MEMBER", False, False))

    def test_createsuperuser_gets_super_admin_role(self):
        u = User.objects.create_superuser("owner", "owner@example.com", PW)
        self.assertEqual(u.role, "SUPER_ADMIN")

    def test_weak_password_rejected(self):
        r = self.client.post("/api/accounts/register/", {"username": "w", "email": "w@e.com", "password": "12345678", "parish": self.p1.id}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_staff_cannot_repoint_themselves_via_me(self):
        c = self.as_user(self.admin1)
        self.assertEqual(c.patch("/api/accounts/me/", {"parish": self.p2.id}, format="json").status_code, 400)
        self.assertEqual(c.patch("/api/accounts/me/", {"role": "SUPER_ADMIN", "phone_number": "0788123456"}, format="json").status_code, 200)
        self.admin1.refresh_from_db()
        self.assertEqual((self.admin1.role, self.admin1.parish_id), ("PARISH_ADMIN", self.p1.id))

    def test_member_can_move_parish_but_group_must_match(self):
        c = self.as_user(self.alice)
        self.assertEqual(c.patch("/api/accounts/me/", {"group": self.g2.id}, format="json").status_code, 400)
        self.assertEqual(c.patch("/api/accounts/me/", {"group": self.g1.id}, format="json").status_code, 200)
        # moving parish drops the old parish's group
        self.assertEqual(c.patch("/api/accounts/me/", {"parish": self.p2.id}, format="json").status_code, 200)
        self.alice.refresh_from_db()
        self.assertEqual((self.alice.parish_id, self.alice.group_id), (self.p2.id, None))

    def test_password_reset_flow_and_throttle(self):
        from django.core import mail
        from accounts.models import PasswordResetOTP
        self.client.post("/api/accounts/password-reset/", {"email": "alice@example.com"}, format="json")
        self.assertEqual(len(mail.outbox), 1)
        code = PasswordResetOTP.objects.get(user=self.alice).code
        r = self.client.post("/api/accounts/password-reset-verify/", {"email": "alice@example.com", "code": code, "new_password": "Zebra-Quartz-81"}, format="json")
        self.assertEqual(r.status_code, 200)
        codes = [self.client.post("/api/accounts/password-reset-verify/", {"email": "alice@example.com", "code": "000000", "new_password": "Zebra-Quartz-81"}, format="json").status_code for _ in range(12)]
        self.assertIn(429, codes)
