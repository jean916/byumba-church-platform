from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from core.permissions import (
    CONTENT_LEVEL, DIOCESE_LEVEL, PARISH_LEVEL, GroupChildScopeMixin, ScopedWriteMixin,
)
from .models import (
    Group, Announcement, Event, GroupMember, Song, GroupPhoto, Sermon, GroupUpdate, GroupUpdatePhoto,
    GroupTypeLogo,
)
from .serializers import (
    GroupSerializer, AnnouncementSerializer, EventSerializer,
    GroupMemberSerializer, SongSerializer, GroupPhotoSerializer, SermonSerializer,
    GroupUpdateSerializer, GroupUpdatePhotoSerializer, GroupTypeLogoSerializer,
)

# Reading is public for all of these (the public site shows them). Writing is
# role- and scope-checked in core/permissions.py: a parish admin can only
# touch their own parish; a group leader only their own group's records.


class GroupViewSet(ScopedWriteMixin, viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    write_roles = PARISH_LEVEL
    scope_fields = ("parish",)

    def get_queryset(self):
        qs = Group.objects.select_related("parish").prefetch_related("members_list", "songs", "photos").all()
        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        return qs


class GroupMemberViewSet(GroupChildScopeMixin, ScopedWriteMixin, viewsets.ModelViewSet):
    serializer_class = GroupMemberSerializer
    write_roles = CONTENT_LEVEL

    def get_queryset(self):
        qs = GroupMember.objects.select_related("group__parish").all()
        group = self.request.query_params.get("group")
        if group:
            qs = qs.filter(group_id=group)
        return qs


class SongViewSet(GroupChildScopeMixin, ScopedWriteMixin, viewsets.ModelViewSet):
    serializer_class = SongSerializer
    write_roles = CONTENT_LEVEL

    def get_queryset(self):
        qs = Song.objects.select_related("group__parish").all()
        group = self.request.query_params.get("group")
        if group:
            qs = qs.filter(group_id=group)
        return qs


class GroupPhotoViewSet(GroupChildScopeMixin, ScopedWriteMixin, viewsets.ModelViewSet):
    serializer_class = GroupPhotoSerializer
    write_roles = CONTENT_LEVEL

    def get_queryset(self):
        qs = GroupPhoto.objects.select_related("group__parish").all()
        group = self.request.query_params.get("group")
        if group:
            qs = qs.filter(group_id=group)
        return qs


class AnnouncementViewSet(ScopedWriteMixin, viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    write_roles = CONTENT_LEVEL
    scope_fields = ("parish", "diocese", "group")

    def get_queryset(self):
        qs = Announcement.objects.select_related("parish", "diocese", "group").all()
        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        return qs


class EventViewSet(ScopedWriteMixin, viewsets.ModelViewSet):
    serializer_class = EventSerializer
    write_roles = CONTENT_LEVEL
    scope_fields = ("parish", "group")

    def get_queryset(self):
        qs = Event.objects.select_related("parish", "group").all()
        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        return qs


class SermonViewSet(ScopedWriteMixin, viewsets.ModelViewSet):
    serializer_class = SermonSerializer
    write_roles = PARISH_LEVEL
    scope_fields = ("parish", "diocese")

    def get_queryset(self):
        qs = Sermon.objects.select_related("parish", "diocese").all()
        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        return qs


class GroupUpdateViewSet(GroupChildScopeMixin, ScopedWriteMixin, viewsets.ModelViewSet):
    """Meeting reports. Public read; a group's leader (and the parish/diocese
    admins) can post for that group only. ?group=<id>, ?parish=<slug>, ?limit=<n>"""

    serializer_class = GroupUpdateSerializer
    write_roles = CONTENT_LEVEL

    def get_queryset(self):
        qs = GroupUpdate.objects.select_related("group__parish").prefetch_related("photos")
        p = self.request.query_params
        if p.get("group"):
            qs = qs.filter(group_id=p["group"])
        if p.get("parish"):
            qs = qs.filter(group__parish__slug=p["parish"])
        if self.action == "list" and p.get("limit", "").isdigit():
            qs = qs[: int(p["limit"])]
        return qs

    def perform_create(self, serializer):
        self.check_write_scope(serializer)
        serializer.save(created_by=self.request.user)


MAX_PHOTOS_PER_UPDATE = 12


class GroupUpdatePhotoViewSet(ScopedWriteMixin, viewsets.ModelViewSet):
    serializer_class = GroupUpdatePhotoSerializer
    write_roles = CONTENT_LEVEL
    scope_fields = ("update",)

    def scope_of(self, obj):
        g = obj.update.group
        return (g.parish, None, g)

    def get_queryset(self):
        return GroupUpdatePhoto.objects.select_related("update__group__parish").all()

    def perform_create(self, serializer):
        self.check_write_scope(serializer)
        if serializer.validated_data["update"].photos.count() >= MAX_PHOTOS_PER_UPDATE:
            raise ValidationError({"detail": f"A report can have at most {MAX_PHOTOS_PER_UPDATE} photos."})
        serializer.save()


class GroupTypeLogoViewSet(ScopedWriteMixin, viewsets.ModelViewSet):
    """Diocese-wide emblem for each kind of group. Public read; only the
    diocese office can change them. ?diocese=<slug>"""

    serializer_class = GroupTypeLogoSerializer
    write_roles = DIOCESE_LEVEL
    scope_fields = ("diocese",)

    def get_queryset(self):
        qs = GroupTypeLogo.objects.select_related("diocese").all()
        slug = self.request.query_params.get("diocese")
        return qs.filter(diocese__slug=slug) if slug else qs
