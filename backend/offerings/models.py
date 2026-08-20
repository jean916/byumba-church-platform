from django.db import models
from django.conf import settings


class Offering(models.Model):
    """A logged contribution. Phase 1 does NOT auto-charge mobile money -
    the member pays via their own phone/bank, then this record is logged
    for reconciliation and reporting. Real MTN/Airtel API integration is a
    Phase 2 addition once the platform is validated (see requirements doc)."""

    class Purpose(models.TextChoices):
        TITHE = "TITHE", "Tithe"
        OFFERING = "OFFERING", "General offering"
        BUILDING_FUND = "BUILDING_FUND", "Building fund"
        GROUP_CONTRIBUTION = "GROUP_CONTRIBUTION", "Group/union contribution"
        OTHER = "OTHER", "Other"

    class Method(models.TextChoices):
        MTN_MOMO = "MTN_MOMO", "MTN Mobile Money"
        AIRTEL_MONEY = "AIRTEL_MONEY", "Airtel Money"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank transfer"
        CASH = "CASH", "Cash"

    parish = models.ForeignKey("dioceses.Parish", on_delete=models.CASCADE, related_name="offerings")
    campaign = models.ForeignKey(
        "Campaign", on_delete=models.SET_NULL, null=True, blank=True, related_name="offerings",
        help_text="Link this contribution to a specific fundraising campaign, if applicable",
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="offerings"
    )
    group = models.ForeignKey("content.Group", on_delete=models.SET_NULL, null=True, blank=True)
    amount_rwf = models.DecimalField(max_digits=12, decimal_places=2)
    purpose = models.CharField(max_length=25, choices=Purpose.choices, default=Purpose.OFFERING)
    method = models.CharField(max_length=20, choices=Method.choices)
    transaction_reference = models.CharField(max_length=100, blank=True, help_text="MoMo/bank ref number, if any")
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="offerings_logged"
    )
    date_given = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date_given"]

    def __str__(self):
        return f"{self.amount_rwf} RWF - {self.get_purpose_display()} ({self.parish.name})"


class Campaign(models.Model):
    """A fundraising goal - e.g. 'Building Fund 2026'. Publicly shows a
    progress bar (target vs. raised so far) and payment instructions.
    Doesn't process payments automatically (no merchant account yet) -
    people pay via MoMo/bank/cash on their own, then confirm via the public
    form below, which creates an Offering linked to this campaign."""

    diocese = models.ForeignKey("dioceses.Diocese", on_delete=models.CASCADE, related_name="campaigns")
    parish = models.ForeignKey(
        "dioceses.Parish", on_delete=models.CASCADE, related_name="campaigns",
        null=True, blank=True, help_text="Leave blank for a diocese-wide campaign",
    )
    title = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    target_amount_rwf = models.DecimalField(max_digits=14, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    # Payment instructions shown publicly - same idea as the general
    # offerings page, but specific to this campaign/project.
    momo_code = models.CharField(max_length=50, blank=True, help_text="MTN MoMo Pay code")
    airtel_code = models.CharField(max_length=50, blank=True, help_text="Airtel Money code")
    bank_details = models.CharField(max_length=250, blank=True, help_text="Bank name + account number")

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return self.title

    @property
    def raised_amount_rwf(self):
        return self.offerings.aggregate(total=models.Sum("amount_rwf"))["total"] or 0
