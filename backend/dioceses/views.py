from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from core.permissions import DIOCESE_LEVEL, PARISH_LEVEL, SUPER, RoleScopedPermission, can_manage
from .models import Diocese, Parish, Clergy
from .serializers import DioceseSerializer, ParishSerializer, ClergySerializer
from .permissions import IsDioceseAdminOrReadOnly


class DioceseViewSet(viewsets.ModelViewSet):
    """Editing the diocese record (theme, logo, socials) is for that
    diocese's admin. Creating/deleting a whole diocese is platform-owner only:
    deleting one cascades to every parish, group and offering under it."""

    queryset = Diocese.objects.all()
    serializer_class = DioceseSerializer
    permission_classes = [IsDioceseAdminOrReadOnly]

    def perform_create(self, serializer):
        if self.request.user.role != SUPER:
            raise PermissionDenied("Only the platform owner can create a diocese.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != SUPER:
            raise PermissionDenied("Only the platform owner can delete a diocese.")
        instance.delete()


class ClergyViewSet(viewsets.ModelViewSet):
    """Public read; writes restricted to the diocese's own admin."""

    serializer_class = ClergySerializer
    permission_classes = [IsDioceseAdminOrReadOnly]

    def get_queryset(self):
        qs = Clergy.objects.select_related("diocese", "parish").all()
        diocese_slug = self.request.query_params.get("diocese")
        if diocese_slug:
            qs = qs.filter(diocese__slug=diocese_slug)
        return qs

    def _check(self, serializer):
        inst, data = serializer.instance, serializer.validated_data
        diocese = data.get("diocese", getattr(inst, "diocese", None))
        parish = data.get("parish", getattr(inst, "parish", None))
        if not can_manage(self.request.user, None, diocese):
            raise PermissionDenied("You can only manage clergy of your own diocese.")
        if parish is not None and diocese is not None and parish.diocese_id != diocese.id:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"parish": "This parish is not in the chosen diocese."})

    def perform_create(self, serializer):
        self._check(serializer)
        serializer.save()

    def perform_update(self, serializer):
        self._check(serializer)
        serializer.save()


class ParishViewSet(viewsets.ModelViewSet):
    """Public list/detail. Diocese admins add/remove parishes; a Parish Admin
    may edit only their own parish's details."""

    serializer_class = ParishSerializer
    permission_classes = [RoleScopedPermission]
    write_roles = PARISH_LEVEL

    def scope_of(self, obj):
        return (obj, obj.diocese, None)

    def get_queryset(self):
        qs = Parish.objects.select_related("diocese").all()
        diocese_slug = self.request.query_params.get("diocese")
        if diocese_slug:
            qs = qs.filter(diocese__slug=diocese_slug)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in DIOCESE_LEVEL or not can_manage(user, None, serializer.validated_data["diocese"]):
            raise PermissionDenied("Only a diocese admin can add a parish.")
        serializer.save()

    def perform_update(self, serializer):
        inst = serializer.instance
        if serializer.validated_data.get("diocese", inst.diocese).id != inst.diocese_id:
            raise PermissionDenied("A parish cannot be moved to another diocese.")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role not in DIOCESE_LEVEL:
            raise PermissionDenied("Only a diocese admin can remove a parish.")
        instance.delete()
