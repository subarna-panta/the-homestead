import json
from datetime import date, timedelta
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Pioneer, Bounty, Claim
from .views_auth import get_pioneer_from_request


def today_str():
    return date.today().isoformat()


def prev_day(date_str, n=1):
    d = date.fromisoformat(date_str)
    return (d - timedelta(days=n)).isoformat()


def get_sheriff_for(pioneer):
    """Return the sheriff for a cowboy, or the pioneer themselves if sheriff."""
    if pioneer.is_sheriff:
        return pioneer
    return pioneer.sheriff


def calc_streak(pioneer_id, bounty_id):
    streak = 0
    date_check = prev_day(today_str())
    for _ in range(60):
        exists = Claim.objects.filter(
            pioneer_id=pioneer_id, bounty_id=bounty_id,
            status="approved", date=date_check,
        ).exists()
        if not exists:
            break
        streak += 1
        date_check = prev_day(date_check)
    return streak


def recalc_grit_meter(pioneer_id):
    today = today_str()
    pioneer = Pioneer.objects.get(id=pioneer_id)
    sheriff = get_sheriff_for(pioneer)
    total = Bounty.objects.filter(sheriff=sheriff).count()
    if total == 0:
        return {"grit_meter": 0, "streak_penalty": False, "streak_rebuild_count": 0}

    approved_today = Claim.objects.filter(pioneer_id=pioneer_id, date=today, status="approved").count()
    new_meter = round((approved_today / total) * 100)
    was_full = pioneer.grit_meter == 100
    is_full = new_meter == 100

    streak_penalty = pioneer.streak_penalty
    streak_rebuild_count = pioneer.streak_rebuild_count

    if is_full and was_full and streak_penalty:
        streak_rebuild_count = min(streak_rebuild_count + 1, 3)
        if streak_rebuild_count >= 3:
            streak_penalty = False
            streak_rebuild_count = 0
    elif not is_full:
        streak_penalty = True
        streak_rebuild_count = 0

    return {"grit_meter": new_meter, "streak_penalty": streak_penalty, "streak_rebuild_count": streak_rebuild_count}


@method_decorator(csrf_exempt, name="dispatch")
class BountiesView(View):
    def get(self, request):
        pioneer = get_pioneer_from_request(request)
        today = today_str()
        sheriff = get_sheriff_for(pioneer) if pioneer else None
        # Only show bounties belonging to the relevant sheriff
        if sheriff:
            bounties = list(Bounty.objects.filter(sheriff=sheriff).order_by("created_at"))
        else:
            bounties = []
        result = [b.to_dict(pioneer, today) for b in bounties]
        result.sort(key=lambda x: (not x["isDueToday"], not x["isOverdue"]))
        return JsonResponse(result, safe=False)

    def post(self, request):
        pioneer = get_pioneer_from_request(request)
        if not pioneer:
            return JsonResponse({"error": "Not authenticated."}, status=401)
        if not pioneer.is_sheriff:
            return JsonResponse({"error": "Only the Sheriff can post bounties."}, status=403)

        data = json.loads(request.body)
        title = data.get("title", "").strip()
        description = data.get("description", "").strip()
        if not title:
            return JsonResponse({"error": "Title is required."}, status=400)

        valid_attrs = ["grit", "labor", "wisdom", "honor"]
        valid_schedules = ["daily", "weekly", "monthly", "none"]
        attr = data.get("attribute", "grit")
        schedule_type = data.get("scheduleType", "none")
        if attr not in valid_attrs:
            attr = "grit"
        if schedule_type not in valid_schedules:
            schedule_type = "none"

        repeat_days = data.get("repeatDays")
        if isinstance(repeat_days, list):
            repeat_days = [int(d) for d in repeat_days if 0 <= int(d) <= 6]
        else:
            repeat_days = None

        bounty = Bounty.objects.create(
            title=title, description=description,
            gold_reward=data.get("goldReward", 50),
            xp_reward=data.get("xpReward", 100),
            attribute=attr, schedule_type=schedule_type,
            scheduled_time=data.get("scheduledTime") or None,
            repeat_days=repeat_days,
            repeat_day_of_month=data.get("repeatDayOfMonth") or None,
            sheriff=pioneer,
        )
        return JsonResponse(bounty.to_dict(), status=201)


@method_decorator(csrf_exempt, name="dispatch")
class BountyDetailView(View):
    def patch(self, request, bounty_id):
        pioneer = get_pioneer_from_request(request)
        if not pioneer or not pioneer.is_sheriff:
            return JsonResponse({"error": "Sheriffs only."}, status=403)
        try:
            bounty = Bounty.objects.get(id=bounty_id, sheriff=pioneer)
        except Bounty.DoesNotExist:
            return JsonResponse({"error": "Bounty not found."}, status=404)

        data = json.loads(request.body)
        for field, model_field in [("title","title"),("description","description"),("goldReward","gold_reward"),("xpReward","xp_reward")]:
            if field in data:
                setattr(bounty, model_field, data[field])
        if "attribute" in data and data["attribute"] in ["grit","labor","wisdom","honor"]:
            bounty.attribute = data["attribute"]
        if "scheduleType" in data and data["scheduleType"] in ["daily","weekly","monthly","none"]:
            bounty.schedule_type = data["scheduleType"]
        if "scheduledTime" in data:
            bounty.scheduled_time = data["scheduledTime"] or None
        if "repeatDays" in data:
            rd = data["repeatDays"]
            bounty.repeat_days = [int(d) for d in rd if 0 <= int(d) <= 6] if isinstance(rd, list) else None
        if "repeatDayOfMonth" in data:
            bounty.repeat_day_of_month = data["repeatDayOfMonth"] or None
        bounty.save()
        return JsonResponse(bounty.to_dict())

    def delete(self, request, bounty_id):
        pioneer = get_pioneer_from_request(request)
        if not pioneer or not pioneer.is_sheriff:
            return JsonResponse({"error": "Sheriffs only."}, status=403)
        try:
            Bounty.objects.get(id=bounty_id, sheriff=pioneer).delete()
            return JsonResponse({"message": "Bounty removed from the board."})
        except Bounty.DoesNotExist:
            return JsonResponse({"error": "Bounty not found."}, status=404)


@method_decorator(csrf_exempt, name="dispatch")
class ClaimBountyView(View):
    def post(self, request, bounty_id):
        pioneer = get_pioneer_from_request(request)
        if not pioneer:
            return JsonResponse({"error": "Not authenticated."}, status=401)

        sheriff = get_sheriff_for(pioneer)
        try:
            bounty = Bounty.objects.get(id=bounty_id, sheriff=sheriff)
        except Bounty.DoesNotExist:
            return JsonResponse({"error": "Bounty not found."}, status=404)

        today = today_str()
        info = bounty.to_dict()
        if bounty.schedule_type not in ("none", "daily") and not info["isDueToday"]:
            return JsonResponse({"error": "This bounty ain't due today, partner."}, status=400)

        if Claim.objects.filter(pioneer=pioneer, bounty=bounty, date=today).exists():
            return JsonResponse({"error": "Already submitted today, partner."}, status=400)

        streak = calc_streak(pioneer.id, bounty.id)
        claim = Claim.objects.create(pioneer=pioneer, bounty=bounty, status="pending", date=today, streak_count=streak + 1)
        return JsonResponse({"message": "Submitted for the Sheriff's review! Await the Ledger.", "claimId": claim.id})


@method_decorator(csrf_exempt, name="dispatch")
class PendingClaimsView(View):
    def get(self, request):
        pioneer = get_pioneer_from_request(request)
        if not pioneer or not pioneer.is_sheriff:
            return JsonResponse({"error": "Sheriffs only, partner."}, status=403)

        # Only claims for this sheriff's cowboys and bounties
        claims = Claim.objects.filter(
            status="pending",
            bounty__sheriff=pioneer,
        ).select_related("pioneer", "bounty").order_by("-claimed_at")

        result = [{
            "claimId": c.id, "bountyId": c.bounty.id, "pioneerId": c.pioneer.id,
            "streakCount": c.streak_count, "date": c.date,
            "claimedAt": c.claimed_at.isoformat(),
            "bountyTitle": c.bounty.title, "attribute": c.bounty.attribute,
            "goldReward": c.bounty.gold_reward, "xpReward": c.bounty.xp_reward,
            "pioneerUsername": c.pioneer.username,
        } for c in claims]
        return JsonResponse(result, safe=False)


@method_decorator(csrf_exempt, name="dispatch")
class ApproveClaimView(View):
    def post(self, request, claim_id):
        sheriff = get_pioneer_from_request(request)
        if not sheriff or not sheriff.is_sheriff:
            return JsonResponse({"error": "Sheriffs only."}, status=403)

        data = json.loads(request.body)
        pioneer_id = data.get("pioneerId")

        try:
            claim = Claim.objects.get(id=claim_id, pioneer_id=pioneer_id, status="pending", bounty__sheriff=sheriff)
        except Claim.DoesNotExist:
            return JsonResponse({"error": "Pending claim not found."}, status=404)

        bounty = claim.bounty
        cowboy = claim.pioneer

        streak_bonus = claim.streak_count >= 7
        penalty_mult = 0.5 if cowboy.streak_penalty else 1.0
        bonus_mult = 2.0 if streak_bonus else 1.0
        gold_awarded = round(bounty.gold_reward * penalty_mult * bonus_mult)
        xp_awarded = bounty.xp_reward

        attr_map = {"grit":"grit_points","labor":"labor_points","wisdom":"wisdom_points","honor":"honor_points"}
        attr_field = attr_map.get(bounty.attribute, "grit_points")

        claim.status = "approved"
        claim.save()

        grit_data = recalc_grit_meter(cowboy.id)
        setattr(cowboy, attr_field, getattr(cowboy, attr_field) + xp_awarded)
        cowboy.gold += gold_awarded
        cowboy.xp += xp_awarded
        cowboy.grit_meter = grit_data["grit_meter"]
        cowboy.streak_penalty = grit_data["streak_penalty"]
        cowboy.streak_rebuild_count = grit_data["streak_rebuild_count"]
        cowboy.save()

        msg = f"Ledger signed! {gold_awarded} Gold deposited."
        if streak_bonus:
            msg += " 🔥 7-Day Gold Rush Bonus!"
        return JsonResponse({"message": msg, "goldAwarded": gold_awarded, "xpAwarded": xp_awarded,
                             "streakCount": claim.streak_count, "streakBonus": streak_bonus})


@method_decorator(csrf_exempt, name="dispatch")
class DeclineClaimView(View):
    def post(self, request, claim_id):
        sheriff = get_pioneer_from_request(request)
        if not sheriff or not sheriff.is_sheriff:
            return JsonResponse({"error": "Sheriffs only."}, status=403)

        data = json.loads(request.body)
        pioneer_id = data.get("pioneerId")
        try:
            claim = Claim.objects.get(id=claim_id, pioneer_id=pioneer_id, status="pending", bounty__sheriff=sheriff)
        except Claim.DoesNotExist:
            return JsonResponse({"error": "Pending claim not found."}, status=404)

        claim.status = "declined"
        claim.save()
        return JsonResponse({"message": "Claim declined. No reward awarded."})
