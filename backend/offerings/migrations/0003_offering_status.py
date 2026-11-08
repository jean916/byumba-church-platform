from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("offerings", "0002_campaign_offering_campaign"),
    ]

    operations = [
        # Every offering that already exists was logged by an admin, so it is
        # confirmed. New rows default to PENDING (see the AlterField below).
        migrations.AddField(
            model_name="offering",
            name="status",
            field=models.CharField(
                choices=[("PENDING", "Pending confirmation"), ("CONFIRMED", "Confirmed")],
                default="CONFIRMED", max_length=10,
            ),
        ),
        migrations.AlterField(
            model_name="offering",
            name="status",
            field=models.CharField(
                choices=[("PENDING", "Pending confirmation"), ("CONFIRMED", "Confirmed")],
                default="PENDING", max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="offering",
            name="confirmed_by",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
                related_name="offerings_confirmed", to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="offering",
            name="confirmed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
