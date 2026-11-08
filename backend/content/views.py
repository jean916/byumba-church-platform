from rest_framework import viewsets

from core.permissions import (
    CONTENT_LEVEL, PARISH_LEVEL, GroupChildScopeMixin, ScopedWriteMixin,
)
from .models import Group, Announcement, Event, GroupMember, Song, GroupPhoto, Sermon
from .serializers import (
    GroupSerializer, AnnouncementSerializer, EventSerializer,
    GroupMemberSerializer, SongSerializer, GroupPhotoSerializer, SermonSerializer,
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
