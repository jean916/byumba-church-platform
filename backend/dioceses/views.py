from rest_framework import viewsets
from .models import Diocese, Parish
from .serializers import DioceseSerializer, ParishSerializer
from .permissions import IsDioceseAdminOrReadOnly, IsOwnParishAdminOrReadOnly


class DioceseViewSet(viewsets.ModelViewSet):
    queryset = Diocese.objects.all()
    serializer_class = DioceseSerializer
    permission_classes = [IsDioceseAdminOrReadOnly]


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
