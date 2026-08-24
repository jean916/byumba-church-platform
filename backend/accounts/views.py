from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import PasswordResetOTP
from .serializers import (
    UserRegistrationSerializer, UserSerializer,
    PasswordResetRequestSerializer, PasswordResetVerifySerializer,
)

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


class PasswordResetRequestView(APIView):
    """Public: takes an email, emails a 6-digit code if an account with
    that email exists. The email also reminds them of their username, since
    people often forget both together. Always returns the same generic
    success message either way - not revealing whether an email is
    registered protects members' privacy."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email__iexact=email).first()
        if user:
            import random
            code = f"{random.randint(0, 999999):06d}"
            PasswordResetOTP.objects.create(user=user, code=code)

            send_mail(
                subject="Your password reset code - Byumba Anglican",
                message=(
                    f"Hello {user.first_name or user.username},\n\n"
                    f"Your username is: {user.username}\n\n"
                    f"Your password reset code is: {code}\n\n"
                    f"This code expires in {PasswordResetOTP.OTP_VALIDITY_MINUTES} minutes. "
                    f"Enter it on the website to set a new password.\n\n"
                    f"If you didn't request this, you can safely ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )

        return Response(
            {"detail": "If an account with that email exists, a reset code has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetVerifyView(APIView):
    """Public: takes the emailed code plus a new password, and changes it
    if the code is valid, unused, and not expired."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user = User.objects.filter(email__iexact=data["email"]).first()
        if not user:
            return Response({"detail": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST)

        otp = (
            PasswordResetOTP.objects.filter(user=user, code=data["code"], used=False)
            .order_by("-created_at")
            .first()
        )
        if not otp or not otp.is_valid():
            return Response({"detail": "Invalid or expired code."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(data["new_password"])
        user.save()
        otp.used = True
        otp.save()
        return Response({"detail": "Password has been reset successfully."}, status=status.HTTP_200_OK)
