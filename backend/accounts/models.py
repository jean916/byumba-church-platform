from django.contrib.auth.models import AbstractUser
from core.validators import validate_rwanda_phone
from django.db import models


class User(AbstractUser):
    """
    Custom user model. Every user (except SUPER_ADMIN) is scoped to a Parish,
    and every Parish belongs to a Diocese - this is what enforces data
    isolation between parishes and makes the platform resellable to other
    dioceses later without changing the data model.
    """

    class Role(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin (platform owner)"
        DIOCESE_ADMIN = "DIOCESE_ADMIN", "Diocese Admin"
        PARISH_ADMIN = "PARISH_ADMIN", "Parish Admin"
        GROUP_LEADER = "GROUP_LEADER", "Union / Group Leader"
        MEMBER = "MEMBER", "Member (Christian)"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    phone_number = models.CharField(max_length=10, blank=True, validators=[validate_rwanda_phone])
    preferred_language = models.CharField(
        max_length=2, choices=[("rw", "Kinyarwanda"), ("en", "English")], default="rw"
    )

    diocese = models.ForeignKey(
        "dioceses.Diocese", null=True, blank=True, on_delete=models.SET_NULL, related_name="admins"
    )
    parish = models.ForeignKey(
        "dioceses.Parish", null=True, blank=True, on_delete=models.SET_NULL, related_name="members"
    )
    group = models.ForeignKey(
        "content.Group", null=True, blank=True, on_delete=models.SET_NULL, related_name="members"
    )

    # Membership details relevant to an Anglican church context
    date_baptized = models.DateField(null=True, blank=True)
    date_confirmed = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"


class PasswordResetOTP(models.Model):
    """A one-time 6-digit code emailed to a user who forgot their password.
    Simpler for people to type on a phone than clicking a link, and the
    email also reminds them of their username - covers both "forgot
    password" and "forgot username" in one flow."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_otps")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    OTP_VALIDITY_MINUTES = 15

    def is_valid(self):
        from django.utils import timezone
        from datetime import timedelta
        if self.used:
            return False
        return timezone.now() <= self.created_at + timedelta(minutes=self.OTP_VALIDITY_MINUTES)
