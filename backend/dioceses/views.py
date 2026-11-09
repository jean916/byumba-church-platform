import logging

from django.conf import settings
from django.core.mail import EmailMessage
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied

from core.permissions import DIOCESE_LEVEL, PARISH_LEVEL, SUPER, RoleScopedPermission, can_manage
from .models import Diocese, Parish, Clergy
from .serializers import ClergySerializer, ContactMessageSerializer, DioceseSerializer, ParishSerializer
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


logger = logging.getLogger(__name__)


class ContactMessageView(APIView):
    """Public contact form -> an email to the diocese's contact address.
    Throttled per visitor, with a hidden honeypot field to catch spam bots.
    The visitor's address goes in Reply-To, so replying just works."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if data.get("website"):  # a bot filled the hidden field - pretend it worked
            return Response({"detail": "sent"})

        diocese = Diocese.objects.filter(id=data["diocese"]).first()
        if not diocese or not diocese.contact_email:
            return Response({"detail": "Messages are not available right now."}, status=503)

        name = " ".join(data["name"].split())  # no line breaks in headers
        body = (
            f"New message from the website contact form\n\n"
            f"Name: {name}\nEmail: {data['email']}\nPhone: {data.get('phone') or '-'}\n\n"
            f"{data['message']}\n"
        )
        try:
            EmailMessage(
                subject=f"Website message from {name}",
                body=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[diocese.contact_email],
                reply_to=[data["email"]],
            ).send(fail_silently=False)
        except Exception:
            logger.exception("Failed to deliver a contact-form message")
            return Response({"detail": "We could not send your message. Please try again later."}, status=502)
        logger.info("Contact-form message delivered to the diocese office")
        return Response({"detail": "sent"})
