import json
import re
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Pioneer, Purchase, StoreItem
from .views_auth import get_pioneer_from_request
from .views_bounties import get_sheriff_for


@method_decorator(csrf_exempt, name="dispatch")
class StoreView(View):
    def get(self, request):
        pioneer = get_pioneer_from_request(request)
        if not pioneer:
            return JsonResponse({"error": "Not authenticated."}, status=401)
        sheriff = get_sheriff_for(pioneer)
        if sheriff is None:
            return JsonResponse({"items": [], "cowboyGold": pioneer.gold, "purchases": []})
        items = list(StoreItem.objects.filter(sheriff=sheriff, is_active=True).order_by("gold").values(
            "id", "key", "name", "description", "gold", "emoji"
        ))
        purchases = Purchase.objects.filter(pioneer=pioneer).order_by("-purchased_at")[:20]
        return JsonResponse({
            "items": items,
            "cowboyGold": pioneer.gold,
            "purchases": [{"itemKey": p.item_key, "purchasedAt": p.purchased_at.isoformat(), "status": p.status} for p in purchases],
        })

    def post(self, request):
        pioneer = get_pioneer_from_request(request)
        if not pioneer:
            return JsonResponse({"error": "Not authenticated."}, status=401)
        if pioneer.is_sheriff:
            return JsonResponse({"error": "Sheriffs don't shop, partner."}, status=403)

        data = json.loads(request.body)
        item_key = data.get("itemKey")
        sheriff = get_sheriff_for(pioneer)
        try:
            item = StoreItem.objects.get(key=item_key, sheriff=sheriff, is_active=True)
        except StoreItem.DoesNotExist:
            return JsonResponse({"error": "No such item in the store."}, status=400)

        if pioneer.gold < item.gold:
            return JsonResponse({"error": f"Need {item.gold} Gold, only got {pioneer.gold}. Ride harder!"}, status=400)

        Purchase.objects.create(pioneer=pioneer, item_key=item.key, gold_cost=item.gold, status="pending")
        pioneer.gold -= item.gold
        pioneer.save()
        return JsonResponse({"message": f"{item.emoji} {item.name} purchased! The Sheriff's been notified.", "remainingGold": pioneer.gold})


@method_decorator(csrf_exempt, name="dispatch")
class StoreItemsAdminView(View):
    def get(self, request):
        pioneer = get_pioneer_from_request(request)
        if not pioneer or not pioneer.is_sheriff:
            return JsonResponse({"error": "Sheriffs only."}, status=403)
        raw = list(StoreItem.objects.filter(sheriff=pioneer).order_by("gold").values(
            "id", "key", "name", "description", "gold", "emoji", "is_active"
        ))
        items = [{**item, "isActive": item.pop("is_active")} for item in raw]
        return JsonResponse(items, safe=False)

    def post(self, request):
        pioneer = get_pioneer_from_request(request)
        if not pioneer or not pioneer.is_sheriff:
            return JsonResponse({"error": "Sheriffs only."}, status=403)

        data = json.loads(request.body)
        name = data.get("name", "").strip()
        description = data.get("description", "").strip()
        gold = data.get("gold", 100)
        emoji = data.get("emoji", "🎁").strip() or "🎁"

        if not name:
            return JsonResponse({"error": "Item name is required."}, status=400)
        try:
            gold = int(gold)
            if gold < 1:
                raise ValueError
        except (ValueError, TypeError):
            return JsonResponse({"error": "Gold cost must be a positive number."}, status=400)

        key = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")
        base_key, counter = key, 1
        while StoreItem.objects.filter(key=key).exists():
            key = f"{base_key}_{counter}"
            counter += 1

        item = StoreItem.objects.create(key=key, name=name, description=description, gold=gold, emoji=emoji, is_active=True, sheriff=pioneer)
        return JsonResponse({"id": item.id, "key": item.key, "name": item.name, "description": item.description,
                             "gold": item.gold, "emoji": item.emoji, "isActive": item.is_active}, status=201)


@method_decorator(csrf_exempt, name="dispatch")
class StoreItemDetailView(View):
    def patch(self, request, item_id):
        pioneer = get_pioneer_from_request(request)
        if not pioneer or not pioneer.is_sheriff:
            return JsonResponse({"error": "Sheriffs only."}, status=403)
        try:
            item = StoreItem.objects.get(id=item_id, sheriff=pioneer)
        except StoreItem.DoesNotExist:
            return JsonResponse({"error": "Item not found."}, status=404)

        data = json.loads(request.body)
        if "name" in data and data["name"].strip():
            item.name = data["name"].strip()
        if "description" in data:
            item.description = data["description"].strip()
        if "gold" in data:
            item.gold = max(1, int(data["gold"]))
        if "emoji" in data and data["emoji"].strip():
            item.emoji = data["emoji"].strip()
        if "isActive" in data:
            item.is_active = bool(data["isActive"])
        item.save()
        return JsonResponse({"id": item.id, "key": item.key, "name": item.name, "description": item.description,
                             "gold": item.gold, "emoji": item.emoji, "isActive": item.is_active})

    def delete(self, request, item_id):
        pioneer = get_pioneer_from_request(request)
        if not pioneer or not pioneer.is_sheriff:
            return JsonResponse({"error": "Sheriffs only."}, status=403)
        try:
            StoreItem.objects.get(id=item_id, sheriff=pioneer).delete()
            return JsonResponse({"message": "Item removed from the store."})
        except StoreItem.DoesNotExist:
            return JsonResponse({"error": "Item not found."}, status=404)


class LeaderboardView(View):
    def get(self, request):
        pioneer = get_pioneer_from_request(request)
        if not pioneer:
            return JsonResponse({"error": "Not authenticated."}, status=401)
        sheriff = get_sheriff_for(pioneer)
        if sheriff is None:
            return JsonResponse([], safe=False)
        pioneers = Pioneer.objects.filter(sheriff=sheriff).order_by("-xp")
        result = [{
            "id": p.id, "username": p.username, "xp": p.xp, "gold": p.gold,
            "gritPoints": p.grit_points, "laborPoints": p.labor_points,
            "wisdomPoints": p.wisdom_points, "honorPoints": p.honor_points,
            "role": p.role, "isSheriff": p.is_sheriff,
        } for p in pioneers]
        return JsonResponse(result, safe=False)


class PurchasesAdminView(View):
    def get(self, request):
        pioneer = get_pioneer_from_request(request)
        if not pioneer or not pioneer.is_sheriff:
            return JsonResponse({"error": "Sheriffs only."}, status=403)
        cowboys = Pioneer.objects.filter(sheriff=pioneer)
        purchases = Purchase.objects.filter(pioneer__in=cowboys).select_related("pioneer").order_by("-purchased_at")[:50]
        store_items = {item.key: item for item in StoreItem.objects.filter(sheriff=pioneer)}
        result = []
        for p in purchases:
            item = store_items.get(p.item_key)
            result.append({
    "id": p.id,
    "pioneerUsername": p.pioneer.username,
    "itemKey": p.item_key,
    "itemName": item.name if item else p.item_key,
    "itemEmoji": item.emoji if item else "🎁",
    "goldCost": p.gold_cost,
    "status": p.status,
    "purchasedAt": p.purchased_at.isoformat(),
})
        return JsonResponse(result, safe=False)


@method_decorator(csrf_exempt, name="dispatch")
class PurchaseActionView(View):
    def post(self, request, purchase_id):
        sheriff = get_pioneer_from_request(request)
        if not sheriff or not sheriff.is_sheriff:
            return JsonResponse({"error": "Sheriffs only."}, status=403)

        data = json.loads(request.body)
        action = data.get("action")  # "delivered" or "denied"
        if action not in ("delivered", "denied"):
            return JsonResponse({"error": "Action must be delivered or denied."}, status=400)

        # Make sure purchase belongs to one of this sheriff's cowboys
        cowboys = Pioneer.objects.filter(sheriff=sheriff)
        try:
            purchase = Purchase.objects.get(id=purchase_id, pioneer__in=cowboys, status="pending")
        except Purchase.DoesNotExist:
            return JsonResponse({"error": "Purchase not found."}, status=404)

        purchase.status = action
        purchase.save()

        # If denied, refund the gold
        if action == "denied":
            purchase.pioneer.gold += purchase.gold_cost
            purchase.pioneer.save()
            return JsonResponse({"message": f"Purchase denied and {purchase.gold_cost} Gold refunded to {purchase.pioneer.username}."})

        return JsonResponse({"message": f"Marked as delivered! {purchase.pioneer.username} got their reward."})
