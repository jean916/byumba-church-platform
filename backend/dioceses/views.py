from rest_framework import viewsets, permissions
from .models import Diocese, Parish, Clergy
from .serializers import DioceseSerializer, ParishSerializer, ClergySerializer
from .permissions import IsDioceseAdminOrReadOnly, IsOwnParishAdminOrReadOnly


class DioceseViewSet(viewsets.ModelViewSet):
    queryset = Diocese.objects.all()
    serializer_class = DioceseSerializer
    permission_classes = [IsDioceseAdminOrReadOnly]


class ClergyViewSet(viewsets.ModelViewSet):
    """A directory of pastors/clergy at every level. Read is public (many
    dioceses like listing their clergy), writes are restricted to Diocese
    Admins since clergy assignment is a diocese-level decision, not a single
    parish's call."""

    serializer_class = ClergySerializer
    permission_classes = [IsDioceseAdminOrReadOnly]

    def get_queryset(self):
        qs = Clergy.objects.select_related("diocese", "parish").all()
        diocese_slug = self.request.query_params.get("diocese")
        if diocese_slug:
            qs = qs.filter(diocese__slug=diocese_slug)
        return qs


class ParishViewSet(viewsets.ModelViewSet):
    """List/detail is public (for the public Parishes page). Writes are
    restricted to Diocese Admins (add/remove parishes) and to a parish's own
    Parish Admin (editing their own parish's details)."""

    serializer_class = ParishSerializer
    permission_classes = [IsOwnParishAdminOrReadOnly]

    def get_queryset(self):
        qs = Parish.objects.select_related("diocese").all()
        diocese_slug = self.request.query_params.get("diocese")
        if diocese_slug:
            qs = qs.filter(diocese__slug=diocese_slug)
        return qs
