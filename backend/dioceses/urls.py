from rest_framework.routers import DefaultRouter
from .views import DioceseViewSet, ParishViewSet, ClergyViewSet

router = DefaultRouter()
router.register("dioceses", DioceseViewSet, basename="diocese")
router.register("parishes", ParishViewSet, basename="parish")
router.register("clergy", ClergyViewSet, basename="clergy")

urlpatterns = router.urls
