from rest_framework import permissions

from core.permissions import DIOCESE_LEVEL, can_manage


class IsDioceseAdminOrReadOnly(permissions.BasePermission):
    """Only Diocese Admins (of that diocese) or the Super Admin may write."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return user.is_authenticated and user.role in DIOCESE_LEVEL

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # A Diocese has no .diocese attribute (it IS the diocese); Clergy does.
        return can_manage(request.user, None, getattr(obj, "diocese", obj))
