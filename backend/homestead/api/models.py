from django.db import models
from django.contrib.auth.hashers import make_password, check_password
import secrets
import json
import random
import string


def generate_join_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))


class Pioneer(models.Model):
    ROLE_CHOICES = [("student", "Student"), ("teacher", "Teacher")]

    username = models.CharField(max_length=64, unique=True)
    password_hash = models.CharField(max_length=256)
    gold = models.IntegerField(default=0)
    xp = models.IntegerField(default=0)
    is_sheriff = models.BooleanField(default=False)
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="student")
    grit_points = models.IntegerField(default=0)
    labor_points = models.IntegerField(default=0)
    wisdom_points = models.IntegerField(default=0)
    honor_points = models.IntegerField(default=0)
    grit_meter = models.IntegerField(default=0)
    streak_penalty = models.BooleanField(default=False)
    streak_rebuild_count = models.IntegerField(default=0)
    badges = models.TextField(default="[]")
    # Sheriff-only: unique join code kids use to join this homestead
    join_code = models.CharField(max_length=6, unique=True, null=True, blank=True)
    # Cowboy-only: which sheriff they belong to
    sheriff = models.ForeignKey(
        "self", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="cowboys"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    def get_badges(self):
        return json.loads(self.badges or "[]")

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "gold": self.gold,
            "xp": self.xp,
            "isSheriff": self.is_sheriff,
            "role": self.role,
            "gritPoints": self.grit_points,
            "laborPoints": self.labor_points,
            "wisdomPoints": self.wisdom_points,
            "honorPoints": self.honor_points,
            "gritMeter": self.grit_meter,
            "streakPenalty": self.streak_penalty,
            "streakRebuildCount": self.streak_rebuild_count,
            "badges": self.get_badges(),
            "joinCode": self.join_code,
            "sheriffId": self.sheriff_id,
        }

    class Meta:
        db_table = "pioneers"


class Session(models.Model):
    token = models.CharField(max_length=128, unique=True)
    pioneer = models.ForeignKey(Pioneer, on_delete=models.CASCADE)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def generate_token():
        return secrets.token_hex(32)

    class Meta:
        db_table = "sessions"


class Bounty(models.Model):
    SCHEDULE_CHOICES = [("daily", "Daily"), ("weekly", "Weekly"), ("monthly", "Monthly"), ("none", "None")]
    ATTRIBUTE_CHOICES = [("grit", "Grit"), ("labor", "Labor"), ("wisdom", "Wisdom"), ("honor", "Honor")]

    title = models.CharField(max_length=200)
    description = models.TextField()
    gold_reward = models.IntegerField(default=50)
    xp_reward = models.IntegerField(default=100)
    attribute = models.CharField(max_length=16, choices=ATTRIBUTE_CHOICES, default="grit")
    schedule_type = models.CharField(max_length=16, choices=SCHEDULE_CHOICES, default="none")
    scheduled_time = models.CharField(max_length=8, null=True, blank=True)
    repeat_days = models.JSONField(null=True, blank=True)
    repeat_day_of_month = models.IntegerField(null=True, blank=True)
    # Which sheriff posted this bounty
    sheriff = models.ForeignKey(
        Pioneer, null=True, blank=True,
        on_delete=models.CASCADE, related_name="posted_bounties"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def to_dict(self, pioneer=None, today_str=None):
        from datetime import datetime
        now = datetime.now()
        js_day = (now.weekday() + 1) % 7
        day_of_month = now.day
        current_hour = now.hour

        is_due_today = False
        is_overdue = False

        if self.schedule_type == "daily":
            is_due_today = True
            if self.scheduled_time:
                hh, mm = map(int, self.scheduled_time.split(":"))
                due_dt = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
                is_overdue = now > due_dt
            # No time set — overdue after 9PM
            else:
                is_overdue = current_hour >= 21

        elif self.schedule_type == "weekly":
            is_due_today = bool(self.repeat_days and js_day in self.repeat_days)
            if is_due_today:
                is_overdue = current_hour >= 21

        elif self.schedule_type == "monthly":
            is_due_today = self.repeat_day_of_month == day_of_month
            if is_due_today:
                is_overdue = current_hour >= 21

        result = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "goldReward": self.gold_reward,
            "xpReward": self.xp_reward,
            "attribute": self.attribute,
            "scheduleType": self.schedule_type,
            "scheduledTime": self.scheduled_time,
            "repeatDays": self.repeat_days,
            "repeatDayOfMonth": self.repeat_day_of_month,
            "createdAt": self.created_at.isoformat(),
            "isDueToday": is_due_today,
            "isOverdue": is_overdue,
            "claimed": False,
            "claimStatus": "none",
            "claimedAt": None,
            "streakCount": 0,
        }

        if pioneer and today_str:
            try:
                claim = Claim.objects.get(pioneer=pioneer, bounty=self, date=today_str)
                result["claimed"] = True
                result["claimStatus"] = claim.status
                result["claimedAt"] = claim.claimed_at.isoformat()
                result["streakCount"] = claim.streak_count
            except Claim.DoesNotExist:
                pass

        return result

    class Meta:
        db_table = "bounties"


class Claim(models.Model):
    STATUS_CHOICES = [("pending", "Pending"), ("approved", "Approved"), ("declined", "Declined")]

    pioneer = models.ForeignKey(Pioneer, on_delete=models.CASCADE)
    bounty = models.ForeignKey(Bounty, on_delete=models.CASCADE)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    date = models.CharField(max_length=10)
    streak_count = models.IntegerField(default=0)
    claimed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "claims"
        unique_together = [("pioneer", "bounty", "date")]


class StoreItem(models.Model):
    key = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=200)
    description = models.CharField(max_length=400)
    gold = models.IntegerField(default=100)
    emoji = models.CharField(max_length=8, default="🎁")
    is_active = models.BooleanField(default=True)
    sheriff = models.ForeignKey(
        Pioneer, null=True, blank=True,
        on_delete=models.CASCADE, related_name="store_items"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "store_items"


class Purchase(models.Model):
    STATUS_CHOICES = [("pending", "Pending"), ("delivered", "Delivered"), ("denied", "Denied")]
    pioneer = models.ForeignKey(Pioneer, on_delete=models.CASCADE)
    item_key = models.CharField(max_length=64)
    gold_cost = models.IntegerField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    purchased_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "purchases"
