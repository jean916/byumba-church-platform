from django.db.models import Sum
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Offering
from .serializers import OfferingSerializer
from .permissions import IsTreasurerOrAdmin


class OfferingViewSet(viewsets.ModelViewSet):
    """
    - Admin roles (Parish/Diocese/Super) see all records for their scope.
    - Regular members only ever see their own logged contributions.
    - `totals` action returns aggregate-only numbers (no individual data),
      matching the "admin sees total offerings" requirement.
    """

    serializer_class = OfferingSerializer
    permission_classes = [IsTreasurerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        qs = Offering.objects.select_related("parish", "member", "group")

        if user.role == "SUPER_ADMIN":
            pass  # full access
        elif user.role == "DIOCESE_ADMIN":
            qs = qs.filter(parish__diocese_id=user.diocese_id)
        elif user.role == "PARISH_ADMIN":
            qs = qs.filter(parish_id=user.parish_id)
        else:
            qs = qs.filter(member=user)  # members: own records only

        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        return qs

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user)

    @action(detail=False, methods=["get"])
    def totals(self, request):
        """Aggregate totals only - safe for the admin dashboard summary view."""
        qs = self.get_queryset()
        by_purpose = (
            qs.values("purpose").annotate(total_rwf=Sum("amount_rwf")).order_by("purpose")
        )
        grand_total = qs.aggregate(total=Sum("amount_rwf"))["total"] or 0
        return Response({"grand_total_rwf": grand_total, "by_purpose": list(by_purpose)})
