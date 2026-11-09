from rest_framework import serializers
from .models import Diocese, Parish, Clergy


class ClergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Clergy
        fields = [
            "id", "diocese", "parish", "name", "level", "archdeaconry",
            "contact_phone", "contact_email", "photo", "notes",
        ]


class ParishSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parish
        fields = [
            "id", "diocese", "name", "slug", "location", "parish_pastor",
            "service_times", "photo", "contact_phone", "archdeaconry", "archdeacon_name",
        ]


class DioceseSerializer(serializers.ModelSerializer):
    parishes = ParishSerializer(many=True, read_only=True)

    class Meta:
        model = Diocese
        fields = [
            "id", "name", "slug", "bishop_name", "description", "logo", "cover_photo",
            "contact_email", "contact_phone", "parishes",
            "history", "vision", "mission", "office_address", "office_hours", "map_url",
            "intego_year", "intego_theme", "intego_verse_reference", "intego_verse_text",
            "facebook_url", "instagram_url", "tiktok_url",
        ]


class ContactMessageSerializer(serializers.Serializer):
    """A message typed into the public Contact form."""

    diocese = serializers.IntegerField()
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    message = serializers.CharField(min_length=5, max_length=2000)
    # Honeypot: hidden from people, filled in by spam bots.
    website = serializers.CharField(required=False, allow_blank=True)
