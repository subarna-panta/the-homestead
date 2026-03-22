from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0003_join_codes"),
    ]

    operations = [
        migrations.AddField(
            model_name="purchase",
            name="status",
            field=models.CharField(
                max_length=16,
                choices=[("pending", "Pending"), ("delivered", "Delivered"), ("denied", "Denied")],
                default="pending",
            ),
        ),
    ]
