from core.validators import validate_image_file, validate_rwanda_phone
from django.db import models


class Diocese(models.Model):
    """A tenant at the top of the hierarchy. Byumba is the first; this model
    is what lets the platform be sold to other dioceses later without any
    code changes - just a new row here."""

    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    bishop_name = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="dioceses/logos/", null=True, blank=True, validators=[validate_image_file])
    cover_photo = models.ImageField(
        upload_to="dioceses/covers/", null=True, blank=True,
        help_text="Wide photo of the church building, used as the homepage background",
        validators=[validate_image_file],
    )
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=10, blank=True, validators=[validate_rwanda_phone])

    # "Intego" - the diocese's annual theme, set fresh each year around a
    # guiding Bible verse. Displayed prominently on the homepage.
    intego_year = models.PositiveIntegerField(null=True, blank=True, help_text="e.g. 2026")
    intego_theme = models.CharField(
        max_length=300, blank=True,
        help_text="The year's theme/motto, e.g. 'Kwizera n'Ubwiyunge' (Faith and Reconciliation)",
    )
    intego_verse_reference = models.CharField(
        max_length=100, blank=True, help_text="e.g. 'Yohana 3:16' or 'John 3:16'",
    )
    intego_verse_text = models.TextField(blank=True, help_text="The full text of the guiding verse")

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
    photo = models.ImageField(upload_to="parishes/photos/", null=True, blank=True, validators=[validate_image_file])
    contact_phone = models.CharField(max_length=10, blank=True, validators=[validate_rwanda_phone])
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


class Clergy(models.Model):
    """A pastor/clergy member at any level of the diocese's leadership
    structure - from the bishop down to parish-level pastors. This is
    separate from Parish.parish_pastor (a quick reference on the parish
    record itself) so the diocese can keep one proper directory of everyone
    ordained, including people not tied to a single parish (e.g. the bishop,
    archdeacons overseeing several parishes)."""

    class Level(models.TextChoices):
        BISHOP = "BISHOP", "Bishop"
        ARCHDEACON = "ARCHDEACON", "Archdeacon"
        PARISH_PASTOR = "PARISH_PASTOR", "Parish Pastor"
        ASSISTANT_PASTOR = "ASSISTANT_PASTOR", "Assistant Pastor"
        DEACON = "DEACON", "Deacon"
        EVANGELIST = "EVANGELIST", "Evangelist"
        OTHER = "OTHER", "Other"

    diocese = models.ForeignKey(Diocese, on_delete=models.CASCADE, related_name="clergy")
    parish = models.ForeignKey(
        Parish, on_delete=models.SET_NULL, null=True, blank=True, related_name="clergy",
        help_text="Leave blank for diocese-wide roles like Bishop",
    )
    name = models.CharField(max_length=200)
    level = models.CharField(max_length=20, choices=Level.choices)
    archdeaconry = models.CharField(max_length=200, blank=True, help_text="For Archdeacons, or pastors tied to one")
    contact_phone = models.CharField(max_length=10, blank=True, validators=[validate_rwanda_phone])
    contact_email = models.EmailField(blank=True)
    photo = models.ImageField(upload_to="clergy/photos/", null=True, blank=True, validators=[validate_image_file])
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["level", "name"]
        verbose_name_plural = "Clergy"

    def __str__(self):
        return f"{self.name} ({self.get_level_display()})"
