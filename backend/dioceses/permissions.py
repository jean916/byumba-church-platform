from rest_framework import permissions


class IsDioceseAdminOrReadOnly(permissions.BasePermission):
    """Only Diocese Admins (or Super Admin) can create/edit/remove parishes."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return user.is_authenticated and user.role in ("DIOCESE_ADMIN", "SUPER_ADMIN")


class IsOwnParishAdminOrReadOnly(permissions.BasePermission):
    """A Parish Admin may only edit content scoped to their own parish."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if not user.is_authenticated:
            return False
        if user.role in ("SUPER_ADMIN", "DIOCESE_ADMIN"):
            return True
        parish = getattr(obj, "parish", obj)  # obj may itself be a Parish
        return user.role == "PARISH_ADMIN" and user.parish_id == getattr(parish, "id", None)
