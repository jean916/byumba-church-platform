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
        ]
