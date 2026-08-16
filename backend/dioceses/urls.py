from rest_framework.routers import DefaultRouter
from .views import DioceseViewSet, ParishViewSet

router = DefaultRouter()
router.register("dioceses", DioceseViewSet, basename="diocese")
router.register("parishes", ParishViewSet, basename="parish")

urlpatterns = router.urls
