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
