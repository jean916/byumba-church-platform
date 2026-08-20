from rest_framework import serializers
from .models import Group, Announcement, Event, GroupMember, Song, GroupPhoto, Sermon


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
