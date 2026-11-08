"""
Role + scope permissions shared by every app.

Rule of thumb (who may WRITE; everyone may READ public content):
  SUPER_ADMIN    - anything, anywhere
  DIOCESE_ADMIN  - anything inside their own diocese
  PARISH_ADMIN   - anything inside their own parish
  GROUP_LEADER   - posts/edits only for their own group (inside their parish)
  MEMBER         - nothing (can only give offerings and edit their profile)

Object-level checks stop edits/deletes of someone else's records. DRF does
NOT run object checks on create, so ScopedWriteMixin also checks the scope
of the *submitted data* before saving - that is what stops a parish admin
from posting into another parish, or moving a record there.
"""
from types import SimpleNamespace

from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied, ValidationError

SUPER = "SUPER_ADMIN"
DIOCESE = "DIOCESE_ADMIN"
PARISH = "PARISH_ADMIN"
LEADER = "GROUP_LEADER"

DIOCESE_LEVEL = (SUPER, DIOCESE)
PARISH_LEVEL = (SUPER, DIOCESE, PARISH)
CONTENT_LEVEL = (SUPER, DIOCESE, PARISH, LEADER)


def can_manage(user, parish=None, diocese=None, group=None):
    """True if `user` may write to a record living in this parish/diocese/group."""
    if not user or not user.is_authenticated:
        return False
    role = user.role
    if role == SUPER:
        return True
    if role == DIOCESE:
        diocese_id = parish.diocese_id if parish is not None else getattr(diocese, "id", None)
        return user.diocese_id is not None and diocese_id == user.diocese_id
    if role == PARISH:
        return parish is not None and user.parish_id is not None and parish.id == user.parish_id
    if role == LEADER:
        return (
            group is not None and parish is not None
            and user.group_id is not None and user.group_id == group.id
            and user.parish_id == parish.id
        )
    return False


class RoleScopedPermission(permissions.BasePermission):
    """Read: anyone. Write: only the view's `write_roles`, and (for existing
    objects) only inside the user's own scope."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        roles = getattr(view, "write_roles", CONTENT_LEVEL)
        return bool(user and user.is_authenticated and user.role in roles)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return can_manage(request.user, *view.scope_of(obj))


class ScopedWriteMixin:
    """Put before ModelViewSet. Set `write_roles` and `scope_fields`
    (model fields that decide where a record lives); override `scope_of`
    if the scope is reached through another object (e.g. group -> parish)."""

    permission_classes = [RoleScopedPermission]
    write_roles = CONTENT_LEVEL
    scope_fields = ("parish", "diocese", "group")

    def scope_of(self, obj):
        return (getattr(obj, "parish", None), getattr(obj, "diocese", None), getattr(obj, "group", None))

    def check_write_scope(self, serializer):
        inst, data = serializer.instance, serializer.validated_data
        values = {
            f: data[f] if f in data else (getattr(inst, f, None) if inst is not None else None)
            for f in self.scope_fields
        }
        parish, diocese, group = self.scope_of(SimpleNamespace(**values))
        if parish is not None and diocese is not None and parish.diocese_id != diocese.id:
            raise ValidationError({"diocese": "This diocese does not match the chosen parish."})
        if not can_manage(self.request.user, parish, diocese, group):
            raise PermissionDenied("You can only add or change records in your own parish or group.")

    def perform_create(self, serializer):
        self.check_write_scope(serializer)
        serializer.save()

    def perform_update(self, serializer):
        self.check_write_scope(serializer)
        serializer.save()


class GroupChildScopeMixin:
    """For records that belong to a Group (members, songs, photos)."""

    scope_fields = ("group",)

    def scope_of(self, obj):
        g = obj.group
        return (g.parish if g else None, None, g)
