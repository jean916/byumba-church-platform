from rest_framework import serializers
from .models import Offering


class OfferingSerializer(serializers.ModelSerializer):
    """Full record - only ever exposed to admin/treasurer roles (see views.py)."""

    class Meta:
        model = Offering
        fields = "__all__"
        read_only_fields = ["logged_by"]


class OfferingTotalSerializer(serializers.Serializer):
    """Aggregate-only view - safe to expose more broadly since it has no
    individual names or amounts tied to a person."""

    period = serializers.CharField()
    purpose = serializers.CharField()
    total_rwf = serializers.DecimalField(max_digits=14, decimal_places=2)
