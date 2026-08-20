from rest_framework import viewsets, permissions
from .models import Group, Announcement, Event, GroupMember, Song, GroupPhoto, Sermon
from .serializers import (
    GroupSerializer, AnnouncementSerializer, EventSerializer,
    GroupMemberSerializer, SongSerializer, GroupPhotoSerializer, SermonSerializer,
)


class GroupViewSet(viewsets.ModelViewSet):
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Group.objects.select_related("parish").prefetch_related("members_list", "songs", "photos").all()
        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        return qs


class GroupMemberViewSet(viewsets.ModelViewSet):
    """Read is public (so the choir's member list shows on the public
    site); adding/removing members requires being logged in as that
    parish's admin/leader, same pattern as everything else."""

    serializer_class = GroupMemberSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = GroupMember.objects.select_related("group").all()
        group = self.request.query_params.get("group")
        if group:
            qs = qs.filter(group_id=group)
        return qs


class SongViewSet(viewsets.ModelViewSet):
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Song.objects.select_related("group").all()
        group = self.request.query_params.get("group")
        if group:
            qs = qs.filter(group_id=group)
        return qs


class GroupPhotoViewSet(viewsets.ModelViewSet):
    serializer_class = GroupPhotoSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = GroupPhoto.objects.select_related("group").all()
        group = self.request.query_params.get("group")
        if group:
            qs = qs.filter(group_id=group)
        return qs


class AnnouncementViewSet(viewsets.ModelViewSet):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Announcement.objects.select_related("parish", "diocese", "group").all()
        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        return qs


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Event.objects.select_related("parish", "group").all()
        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        return qs

class SermonViewSet(viewsets.ModelViewSet):
    serializer_class = SermonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Sermon.objects.select_related("parish", "diocese").all()
        parish = self.request.query_params.get("parish")
        if parish:
            qs = qs.filter(parish__slug=parish)
        return qs
