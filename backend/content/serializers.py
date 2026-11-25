from rest_framework import serializers
from .models import (
    Group, Announcement, Event, GroupMember, Song, GroupPhoto, Sermon, GroupUpdate, GroupUpdatePhoto,
    GroupTypeLogo,
)


class GroupMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupMember
        fields = ["id", "group", "name", "is_married"]


class SongSerializer(serializers.ModelSerializer):
    class Meta:
        model = Song
        fields = ["id", "group", "title"]


class GroupPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupPhoto
        fields = ["id", "group", "image", "caption", "uploaded_at"]


class GroupSerializer(serializers.ModelSerializer):
    # Nested read-only so the public/group pages get everything in one call;
    # adding/removing individual members, songs, and photos happens through
    # their own small endpoints below (simpler than editing a nested list).
    members_list = GroupMemberSerializer(many=True, read_only=True)
    songs = SongSerializer(many=True, read_only=True)
    photos = GroupPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Group
        fields = "__all__"


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = "__all__"


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"


class SermonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sermon
        fields = "__all__"


class GroupUpdatePhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupUpdatePhoto
        fields = ["id", "update", "image", "caption"]


class GroupUpdateSerializer(serializers.ModelSerializer):
    photos = GroupUpdatePhotoSerializer(many=True, read_only=True)
    group_name = serializers.CharField(source="group.name", read_only=True)
    parish = serializers.IntegerField(source="group.parish_id", read_only=True)

    class Meta:
        model = GroupUpdate
        # created_by is deliberately not exposed publicly.
        fields = ["id", "group", "group_name", "parish", "title", "text", "event_date", "created_at", "photos"]
        read_only_fields = ["created_at"]


class GroupTypeLogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupTypeLogo
        fields = ["id", "diocese", "group_type", "logo"]
