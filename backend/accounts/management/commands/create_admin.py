"""
One-time/idempotent admin account setup - reads credentials from environment
variables so it can run automatically during deployment (e.g. in Render's
build command), without needing paid shell access.

Safe to run on every deploy: if the account already exists, it just updates
the password/role rather than erroring or creating a duplicate.
"""
import os
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Creates or updates the initial Super Admin account from ADMIN_USERNAME/ADMIN_PASSWORD env vars."

    def handle(self, *args, **options):
        username = os.environ.get("ADMIN_USERNAME")
        password = os.environ.get("ADMIN_PASSWORD")

        if not username or not password:
            self.stdout.write(self.style.WARNING(
                "ADMIN_USERNAME or ADMIN_PASSWORD not set - skipping admin account setup."
            ))
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"is_staff": True, "is_superuser": True, "role": User.Role.SUPER_ADMIN},
        )
        user.is_staff = True
        user.is_superuser = True
        user.role = User.Role.SUPER_ADMIN
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} admin account '{username}'."))
