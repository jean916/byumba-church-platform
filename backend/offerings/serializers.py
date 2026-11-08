from rest_framework import serializers
from .models import Offering, Campaign


class OfferingSerializer(serializers.ModelSerializer):
    """Full record - only ever exposed to the person who gave it and to admins
    in scope (see views.py). `status`, `logged_by` and the confirmation fields
    are set by the server, never by the client."""

    class Meta:
        model = Offering
        fields = "__all__"
        read_only_fields = ["logged_by", "status", "confirmed_by", "confirmed_at"]
        # Members don't send a parish - the server works it out from the campaign
        # or their own account (see OfferingViewSet.perform_create).
        extra_kwargs = {"parish": {"required": False, "allow_null": True}}

    def validate_amount_rwf(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value


class OfferingTotalSerializer(serializers.Serializer):
    """Aggregate-only view - safe to expose more broadly since it has no
    individual names or amounts tied to a person."""

    period = serializers.CharField()
    purpose = serializers.CharField()
    total_rwf = serializers.DecimalField(max_digits=14, decimal_places=2)


class CampaignSerializer(serializers.ModelSerializer):
    # Read-only computed total (confirmed gifts only) - safe to expose publicly
    # since it's an aggregate, same privacy principle as the totals endpoint.
    raised_amount_rwf = serializers.ReadOnlyField()

    class Meta:
        model = Campaign
        fields = [
            "id", "diocese", "parish", "title", "description", "target_amount_rwf",
            "raised_amount_rwf", "start_date", "end_date", "is_active",
            "momo_code", "airtel_code", "bank_details",
        ]
