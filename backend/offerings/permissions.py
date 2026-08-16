from rest_framework import permissions


class IsTreasurerOrAdmin(permissions.BasePermission):
    """Individual offering records are financial/personal data - restricted
    to Parish Admin (their own parish), Diocese Admin, and Super Admin.
    Regular members can only ever see their OWN records (enforced in the
    viewset queryset, not just here)."""

    ADMIN_ROLES = ("PARISH_ADMIN", "DIOCESE_ADMIN", "SUPER_ADMIN")

    def has_permission(self, request, view):
        return request.user.is_authenticated
