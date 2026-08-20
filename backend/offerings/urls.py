from rest_framework.routers import DefaultRouter
from .views import OfferingViewSet, CampaignViewSet

router = DefaultRouter()
router.register("campaigns", CampaignViewSet, basename="campaign")
router.register("", OfferingViewSet, basename="offering")

urlpatterns = router.urls
