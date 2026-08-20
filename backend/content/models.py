from core.validators import validate_image_file
from django.db import models


class Group(models.Model):
    """Mothers' Union, Fathers' Union, Youth Union, Amatorero (choirs),
    Sunday School, etc. Each is scoped to one parish, so the same union type
    can exist independently across many parishes."""

    class GroupType(models.TextChoices):
        MOTHERS_UNION = "MOTHERS_UNION", "Mothers' Union"
        FATHERS_UNION = "FATHERS_UNION", "Fathers' Union"
        YOUTH_UNION = "YOUTH_UNION", "Youth Union"
        CHOIR = "CHOIR", "Amatorero (Choir)"
        CHILDREN = "CHILDREN", "Children / Sunday School"
        GFS = "GFS", "Girls' Friendly Society (GFS)"
        OTHER = "OTHER", "Other"

    parish = models.ForeignKey("dioceses.Parish", on_delete=models.CASCADE, related_name="groups")
    group_type = models.CharField(max_length=20, choices=GroupType.choices)
    name = models.CharField(max_length=200, help_text="Display name, e.g. 'Byumba Youth Union'")
    description = models.TextField(blank=True)
    leader_name = models.CharField(max_length=200, blank=True)
    leader_contact = models.CharField(max_length=100, blank=True)
    photo = models.ImageField(upload_to="groups/photos/", null=True, blank=True, validators=[validate_image_file])

    def __str__(self):
        return f"{self.name} - {self.parish.name}"


class GroupMember(models.Model):
    """A member of a group - most useful for choirs (Amatorero), where the
    diocese wants to track who's in the choir and their marital status, but
    works for any group type."""

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="members_list")
    name = models.CharField(max_length=200)
    is_married = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.group.name})"


class Song(models.Model):
    """A song in a choir's repertoire."""

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="songs")
    title = models.CharField(max_length=250)

    class Meta:
        ordering = ["title"]

    def __str__(self):
        return f"{self.title} ({self.group.name})"


class GroupPhoto(models.Model):
    """One photo in a group's gallery. Separate from Group.photo (the single
    cover image) since choirs specifically wanted multiple pictures."""

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="groups/gallery/", validators=[validate_image_file])
    caption = models.CharField(max_length=250, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"Photo for {self.group.name}"


class Announcement(models.Model):
    parish = models.ForeignKey(
        "dioceses.Parish", on_delete=models.CASCADE, related_name="announcements",
        null=True, blank=True, help_text="Leave blank for a diocese-wide announcement",
    )
    diocese = models.ForeignKey("dioceses.Diocese", on_delete=models.CASCADE, related_name="announcements")
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True, related_name="announcements")
    title_en = models.CharField(max_length=250)
    title_rw = models.CharField(max_length=250, blank=True)
    body_en = models.TextField()
    body_rw = models.TextField(blank=True)
    published_at = models.DateTimeField(auto_now_add=True)
    is_pinned = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_pinned", "-published_at"]

    def __str__(self):
        return self.title_en


class Event(models.Model):
    parish = models.ForeignKey("dioceses.Parish", on_delete=models.CASCADE, related_name="events")
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    title_en = models.CharField(max_length=250)
    title_rw = models.CharField(max_length=250, blank=True)
    description_en = models.TextField(blank=True)
    description_rw = models.TextField(blank=True)
    start_time = models.DateTimeField()
    location = models.CharField(max_length=250, blank=True)

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return self.title_en


class Sermon(models.Model):
    """A sermon record - can be text (typed out), a video link (e.g. YouTube),
    an audio link, or any combination. Not a file upload for audio/video since
    hosting large media files isn't practical for a small church server -
    linking to YouTube/SoundCloud/etc. is more sustainable."""

    parish = models.ForeignKey(
        "dioceses.Parish", on_delete=models.CASCADE, related_name="sermons",
        null=True, blank=True, help_text="Leave blank for a diocese-wide sermon",
    )
    diocese = models.ForeignKey("dioceses.Diocese", on_delete=models.CASCADE, related_name="sermons")
    title = models.CharField(max_length=250)
    preacher_name = models.CharField(max_length=200, blank=True)
    date_preached = models.DateField()
    scripture_reference = models.CharField(max_length=200, blank=True, help_text="e.g. John 3:16-21")
    summary = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    audio_url = models.URLField(blank=True)

    class Meta:
        ordering = ["-date_preached"]

    def __str__(self):
        return self.title
