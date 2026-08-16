from django.db import models


class Diocese(models.Model):
    """A tenant at the top of the hierarchy. Byumba is the first; this model
    is what lets the platform be sold to other dioceses later without any
    code changes - just a new row here."""

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    bishop_name = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="dioceses/logos/", null=True, blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.name


class Parish(models.Model):
    """Number of parishes per diocese is not fixed - Diocese Admins add/edit/
    remove these freely. Every parish gets an isolated slice of data: its own
    admin(s), groups, members, and offerings."""

    diocese = models.ForeignKey(Diocese, on_delete=models.CASCADE, related_name="parishes")
    name = models.CharField(max_length=200)
    slug = models.SlugField()
    location = models.CharField(max_length=200, blank=True, help_text="Sector/Cell/Village")
    parish_pastor = models.CharField(max_length=200, blank=True)
    service_times = models.TextField(blank=True, help_text="e.g. Sunday 8:00 AM & 10:30 AM")
    photo = models.ImageField(upload_to="parishes/photos/", null=True, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    archdeaconry = models.CharField(
        max_length=200, blank=True,
        help_text="e.g. 'Byumba Archdeaconry' - the group of parishes this one belongs to",
    )
    archdeacon_name = models.CharField(
        max_length=200, blank=True,
        help_text="The Venerable/Archdeacon overseeing this parish's archdeaconry",
    )

    class Meta:
        unique_together = ("diocese", "slug")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.diocese.name})"
