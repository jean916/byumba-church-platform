from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import ClergyViewSet, ContactMessageView, DioceseViewSet, ParishViewSet

router = DefaultRouter()
router.register("dioceses", DioceseViewSet, basename="diocese")
router.register("parishes", ParishViewSet, basename="parish")
router.register("clergy", ClergyViewSet, basename="clergy")

urlpatterns = [path("contact/", ContactMessageView.as_view(), name="contact")] + router.urls
