from rest_framework import serializers
from .models import Offering, Campaign


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


class CampaignSerializer(serializers.ModelSerializer):
    # Read-only computed total - safe to expose publicly since it's an
    # aggregate, same privacy principle as the offerings totals endpoint.
    raised_amount_rwf = serializers.ReadOnlyField()

    class Meta:
        model = Campaign
        fields = [
            "id", "diocese", "parish", "title", "description", "target_amount_rwf",
            "raised_amount_rwf", "start_date", "end_date", "is_active",
            "momo_code", "airtel_code", "bank_details",
        ]
