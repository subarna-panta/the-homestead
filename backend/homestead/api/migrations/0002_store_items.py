from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="StoreItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("key", models.CharField(max_length=64, unique=True)),
                ("name", models.CharField(max_length=200)),
                ("description", models.CharField(max_length=400)),
                ("gold", models.IntegerField(default=100)),
                ("emoji", models.CharField(default="🎁", max_length=8)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "store_items"},
        ),
        migrations.RunSQL(
            """
            INSERT INTO store_items (key, name, description, gold, emoji, is_active, created_at)
            VALUES
              ('cactus_juice',    'Cactus Juice',       '30 min Screen Time',   100, '🌵', 1, datetime('now')),
              ('golden_saddle',   'The Golden Saddle',  'Choose Dinner Tonight', 250, '🐴', 1, datetime('now')),
              ('midnight_patrol', 'Midnight Patrol',    'Stay up 30 min Late',  500, '🌙', 1, datetime('now'));
            """,
            reverse_sql="DELETE FROM store_items WHERE key IN ('cactus_juice','golden_saddle','midnight_patrol');",
        ),
    ]
