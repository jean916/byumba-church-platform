from rest_framework.routers import DefaultRouter
from .views import (
    GroupViewSet, AnnouncementViewSet, EventViewSet,
    GroupMemberViewSet, SongViewSet, GroupPhotoViewSet, SermonViewSet,
)

router = DefaultRouter()
router.register("groups", GroupViewSet, basename="group")
router.register("group-members", GroupMemberViewSet, basename="group-member")
router.register("songs", SongViewSet, basename="song")
router.register("group-photos", GroupPhotoViewSet, basename="group-photo")
router.register("announcements", AnnouncementViewSet, basename="announcement")
router.register("events", EventViewSet, basename="event")
router.register("sermons", SermonViewSet, basename="sermon")

urlpatterns = router.urls
