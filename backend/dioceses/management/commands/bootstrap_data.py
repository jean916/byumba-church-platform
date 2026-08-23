"""
Sets up the initial Diocese of Byumba record and all 18 real parishes with
their correct archdeaconry structure - safe to run on every deploy (uses
get_or_create/update, never duplicates), so it can run automatically during
Render's build step without needing paid shell access.
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from dioceses.models import Diocese, Parish


PARISHES = [
    ("Kibali", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Cathedral (Byumba)", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Rugandu", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Kageyo", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Mugina", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Bisika", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Rebero", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Gakenke", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Tumba", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Kigarama", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Kavumu", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Gaseke", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Gitovu", "Byumba Archdeaconry", "Ven. Dismas Ngendabanga"),
    ("Ngarama", "Gatsibo Archdeaconry", "Ven. Canon Cesar Ndayisaba"),
    ("Gatsibo", "Gatsibo Archdeaconry", "Ven. Canon Cesar Ndayisaba"),
    ("Rutoma", "Gatsibo Archdeaconry", "Ven. Canon Cesar Ndayisaba"),
    ("Mimuri", "Gatsibo Archdeaconry", "Ven. Canon Cesar Ndayisaba"),
    ("Nyagihanga", "Gatsibo Archdeaconry", "Ven. Canon Cesar Ndayisaba"),
]

SLUG_OVERRIDES = {"Cathedral (Byumba)": "byumba-cathedral"}


class Command(BaseCommand):
    help = "Creates/updates the Diocese of Byumba and its 18 real parishes. Safe to re-run."

    def handle(self, *args, **options):
        diocese, created = Diocese.objects.get_or_create(
            slug="byumba",
            defaults={
                "name": "Diocese of Byumba",
                "bishop_name": "Rt. Rev. Emmanuel Ngendahayo",
            },
        )
        if not created and not diocese.bishop_name:
            diocese.bishop_name = "Rt. Rev. Emmanuel Ngendahayo"
            diocese.save()
        self.stdout.write(self.style.SUCCESS(
            f"{'Created' if created else 'Found existing'} diocese: {diocese.name}"
        ))

        created_count = 0
        updated_count = 0
        for name, archdeaconry, archdeacon in PARISHES:
            slug = SLUG_OVERRIDES.get(name, slugify(name))
            parish, was_created = Parish.objects.get_or_create(
                diocese=diocese,
                slug=slug,
                defaults={"name": name, "archdeaconry": archdeaconry, "archdeacon_name": archdeacon},
            )
            if was_created:
                created_count += 1
            else:
                parish.archdeaconry = archdeaconry
                parish.archdeacon_name = archdeacon
                parish.save()
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Parishes: created {created_count}, updated {updated_count}. "
            f"Total for {diocese.name}: {diocese.parishes.count()}"
        ))
