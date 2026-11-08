from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from core.permissions import PARISH_LEVEL, ScopedWriteMixin, can_manage
from .models import Offering, Campaign
from .serializers import OfferingSerializer, CampaignSerializer
from .permissions import IsTreasurerOrAdmin


class OfferingViewSet(viewsets.ModelViewSet):
    """
    - Parish/Diocese/Super admins see (and can log, edit, delete, confirm)
      the records in their own scope. Admin-logged gifts are confirmed at once.
    - Everyone else (members, group leaders) can only ever see their OWN
      records, and can only CREATE one: the server fixes who gave it and to
      which parish, and it stays PENDING until an admin confirms it.
    - `totals` returns aggregate-only numbers over CONFIRMED gifts.
    """

    serializer_class = OfferingSerializer
    permission_classes = [IsTreasurerOrAdmin]

    # --- scoping -------------------------------------------------------
    def get_queryset(self):
        user = self.request.user
        qs = Offering.objects.select_related("parish", "member", "group", "campaign")

        if user.role == "SUPER_ADMIN":
            pass
        elif user.role == "DIOCESE_ADMIN":
            qs = qs.filter(parish__diocese_id=user.diocese_id)
        elif user.role == "PARISH_ADMIN":
            qs = qs.filter(parish_id=user.parish_id)
        else:
            qs = qs.filter(member=user)

        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        status = self.request.query_params.get("status")
        if status in Offering.Status.values:
            qs = qs.filter(status=status)
        return qs

    def _require_admin_in_scope(self, parish):
        user = self.request.user
        if user.role not in PARISH_LEVEL or not can_manage(user, parish):
            raise PermissionDenied("Only an admin of this parish can change or confirm offerings.")

    # --- create / update / delete -------------------------------------
    def perform_create(self, serializer):
        user, data = self.request.user, serializer.validated_data

        if user.role in PARISH_LEVEL:
            parish = data.get("parish")
            if parish is None:
                raise ValidationError({"parish": "Choose the parish this gift belongs to."})
            self._require_admin_in_scope(parish)
            member = data.get("member")
            if member is not None and member.parish_id != parish.id:
                raise ValidationError({"member": "This member belongs to a different parish."})
            serializer.save(
                logged_by=user, status=Offering.Status.CONFIRMED,
                confirmed_by=user, confirmed_at=timezone.now(),
            )
            return

        # A member (or group leader) reporting their own gift.
        campaign = data.get("campaign")
        if campaign is not None:
            if not campaign.is_active:
                raise ValidationError({"campaign": "This campaign is closed."})
            parish = campaign.parish or user.parish
        else:
            parish = user.parish
        if parish is None:
            raise ValidationError({"detail": "Please choose your parish in your account before giving."})
        if campaign is not None and campaign.diocese_id != parish.diocese_id:
            raise ValidationError({"campaign": "This campaign is not open to your diocese."})
        serializer.save(
            logged_by=user, member=user, parish=parish, group=None,
            status=Offering.Status.PENDING,
        )

    def perform_update(self, serializer):
        self._require_admin_in_scope(serializer.instance.parish)
        new_parish = serializer.validated_data.get("parish")
        if new_parish is not None:
            self._require_admin_in_scope(new_parish)
        serializer.save()

    def perform_destroy(self, instance):
        self._require_admin_in_scope(instance.parish)
        instance.delete()

    @action(detail=True, methods=["post"])
    def confirm(self, request, pk=None):
        """An admin confirms a pending gift after checking it against the
        MoMo/bank/cash record. Only confirmed gifts count anywhere."""
        offering = self.get_object()
        self._require_admin_in_scope(offering.parish)
        if offering.status != Offering.Status.CONFIRMED:
            offering.status = Offering.Status.CONFIRMED
            offering.confirmed_by = request.user
            offering.confirmed_at = timezone.now()
            offering.save(update_fields=["status", "confirmed_by", "confirmed_at"])
        return Response(self.get_serializer(offering).data)

    @action(detail=False, methods=["get"])
    def totals(self, request):
        """Aggregate totals only - confirmed gifts, plus how much is waiting."""
        qs = self.get_queryset()
        confirmed = qs.filter(status=Offering.Status.CONFIRMED)
        pending = qs.filter(status=Offering.Status.PENDING)
        by_purpose = confirmed.values("purpose").annotate(total_rwf=Sum("amount_rwf")).order_by("purpose")
        return Response({
            "grand_total_rwf": confirmed.aggregate(total=Sum("amount_rwf"))["total"] or 0,
            "by_purpose": list(by_purpose),
            "pending_count": pending.count(),
            "pending_total_rwf": pending.aggregate(total=Sum("amount_rwf"))["total"] or 0,
        })


class CampaignViewSet(ScopedWriteMixin, viewsets.ModelViewSet):
    """Public read (everyone sees active campaigns and confirmed progress).
    Writes: a Parish Admin manages their own parish's campaigns; diocese-wide
    campaigns (no parish) need a Diocese Admin."""

    serializer_class = CampaignSerializer
    write_roles = PARISH_LEVEL
    scope_fields = ("parish", "diocese")

    def get_queryset(self):
        qs = Campaign.objects.select_related("diocese", "parish").all()
        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        if self.request.query_params.get("active") == "true":
            qs = qs.filter(is_active=True)
        return qs
