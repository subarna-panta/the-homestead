from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Pioneer",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("username", models.CharField(max_length=64, unique=True)),
                ("password_hash", models.CharField(max_length=256)),
                ("gold", models.IntegerField(default=0)),
                ("xp", models.IntegerField(default=0)),
                ("is_sheriff", models.BooleanField(default=False)),
                ("role", models.CharField(choices=[("student","Student"),("teacher","Teacher")], default="student", max_length=16)),
                ("grit_points", models.IntegerField(default=0)),
                ("labor_points", models.IntegerField(default=0)),
                ("wisdom_points", models.IntegerField(default=0)),
                ("honor_points", models.IntegerField(default=0)),
                ("grit_meter", models.IntegerField(default=100)),
                ("streak_penalty", models.BooleanField(default=False)),
                ("streak_rebuild_count", models.IntegerField(default=0)),
                ("badges", models.TextField(default="[]")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "pioneers"},
        ),
        migrations.CreateModel(
            name="Session",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token", models.CharField(max_length=128, unique=True)),
                ("expires_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("pioneer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.pioneer")),
            ],
            options={"db_table": "sessions"},
        ),
        migrations.CreateModel(
            name="Bounty",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("description", models.TextField()),
                ("gold_reward", models.IntegerField(default=50)),
                ("xp_reward", models.IntegerField(default=100)),
                ("attribute", models.CharField(choices=[("grit","Grit"),("labor","Labor"),("wisdom","Wisdom"),("honor","Honor")], default="grit", max_length=16)),
                ("schedule_type", models.CharField(choices=[("daily","Daily"),("weekly","Weekly"),("monthly","Monthly"),("none","None")], default="none", max_length=16)),
                ("scheduled_time", models.CharField(blank=True, max_length=8, null=True)),
                ("repeat_days", models.JSONField(blank=True, null=True)),
                ("repeat_day_of_month", models.IntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "bounties"},
        ),
        migrations.CreateModel(
            name="Claim",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("status", models.CharField(choices=[("pending","Pending"),("approved","Approved"),("declined","Declined")], default="pending", max_length=16)),
                ("date", models.CharField(max_length=10)),
                ("streak_count", models.IntegerField(default=0)),
                ("claimed_at", models.DateTimeField(auto_now_add=True)),
                ("bounty", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.bounty")),
                ("pioneer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.pioneer")),
            ],
            options={"db_table": "claims", "unique_together": {("pioneer", "bounty", "date")}},
        ),
        migrations.CreateModel(
            name="Purchase",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("item_key", models.CharField(max_length=64)),
                ("gold_cost", models.IntegerField()),
                ("purchased_at", models.DateTimeField(auto_now_add=True)),
                ("pioneer", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="api.pioneer")),
            ],
            options={"db_table": "purchases"},
        ),
    ]
