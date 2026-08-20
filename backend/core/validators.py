"""Shared validators for user-uploaded files and form fields."""
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

MAX_IMAGE_SIZE_MB = 5
ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}


def validate_image_file(file):
    """Rejects overly large files or non-image extensions before they're
    saved. Django's ImageField already checks the file is a genuine,
    unbroken image (via Pillow) - this adds a size cap and an extension
    allow-list on top of that."""
    if file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise ValidationError(f"Image must be smaller than {MAX_IMAGE_SIZE_MB}MB.")

    ext = file.name.rsplit(".", 1)[-1].lower() if "." in file.name else ""
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file type '.{ext}'. Allowed: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}."
        )


# Rwandan mobile numbers: exactly 10 digits, starting with 07
# (e.g. 0788763442). Rejects anything shorter/longer or with letters.
validate_rwanda_phone = RegexValidator(
    regex=r"^07[0-9]{8}$",
    message="Enter a valid Rwandan phone number: 10 digits starting with 07 (e.g. 0788123456).",
)
