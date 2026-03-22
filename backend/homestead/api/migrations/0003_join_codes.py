from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0002_store_items"),
    ]

    operations = [
        # Add join_code and sheriff FK to pioneers
        migrations.AddField(
            model_name="pioneer",
            name="join_code",
            field=models.CharField(blank=True, max_length=6, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="pioneer",
            name="sheriff",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cowboys", to="api.pioneer",
            ),
        ),
        # Add sheriff FK to bounties
        migrations.AddField(
            model_name="bounty",
            name="sheriff",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="posted_bounties", to="api.pioneer",
            ),
        ),
        # Add sheriff FK to store items
        migrations.AddField(
            model_name="storeitem",
            name="sheriff",
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="store_items", to="api.pioneer",
            ),
        ),
    ]
