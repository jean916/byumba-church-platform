from django.contrib.auth import get_user_model
from rest_framework import generics, permissions

from .serializers import UserRegistrationSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Public self-registration endpoint - open to anyone."""
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class MemberListView(generics.ListAPIView):
    """Admin-only: lets a Parish/Diocese/Super admin look up members so they
    can attribute a logged offering to the right person. Scoped the same way
    as everything else - a Parish Admin only sees their own parish's members."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.filter(role=User.Role.MEMBER)
        if user.role == "SUPER_ADMIN":
            pass
        elif user.role == "DIOCESE_ADMIN":
            qs = qs.filter(parish__diocese_id=user.diocese_id)
        elif user.role in ("PARISH_ADMIN", "GROUP_LEADER"):
            qs = qs.filter(parish_id=user.parish_id)
        else:
            qs = qs.none()
        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        return qs.order_by("first_name", "last_name")
