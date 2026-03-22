import json
from datetime import timedelta
from django.http import JsonResponse
from django.views import View
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Pioneer, Session, generate_join_code


def get_pioneer_from_request(request):
    token = request.COOKIES.get("frontier_session")
    if not token:
        return None
    try:
        session = Session.objects.select_related("pioneer").get(token=token)
        if timezone.now() > session.expires_at:
            session.delete()
            return None
        return session.pioneer
    except Session.DoesNotExist:
        return None


def create_session(pioneer, response):
    token = Session.generate_token()
    expires_at = timezone.now() + timedelta(days=7)
    Session.objects.create(token=token, pioneer=pioneer, expires_at=expires_at)
    response.set_cookie(
        "frontier_session", token,
        expires=expires_at,
        httponly=True,
        samesite="Lax",
    )
    return response


@method_decorator(csrf_exempt, name="dispatch")
class SignupView(View):
    def post(self, request):
        data = json.loads(request.body)
        username = data.get("username", "").strip()
        password = data.get("password", "")
        role = data.get("role", "student")
        join_code = data.get("joinCode", "").strip().upper()

        if not username or not password:
            return JsonResponse({"error": "Username and password are required, partner."}, status=400)
        if len(username) < 3:
            return JsonResponse({"error": "Username must be at least 3 characters."}, status=400)
        if len(password) < 4:
            return JsonResponse({"error": "Password must be at least 4 characters."}, status=400)

        normalized_role = "teacher" if role == "teacher" else "student"
        is_sheriff = normalized_role == "teacher"

        # Cowboys must provide a valid join code
        sheriff = None
        if not is_sheriff:
            if not join_code:
                return JsonResponse({"error": "Cowboys need a join code from their Sheriff to sign up."}, status=400)
            try:
                sheriff = Pioneer.objects.get(join_code=join_code, is_sheriff=True)
            except Pioneer.DoesNotExist:
                return JsonResponse({"error": "That join code doesn't match any homestead. Check with your Sheriff."}, status=400)

        if Pioneer.objects.filter(username=username).exists():
            return JsonResponse({"error": "That name's already taken in these parts."}, status=400)

        pioneer = Pioneer(username=username, password_hash="", is_sheriff=is_sheriff, role=normalized_role)
        pioneer.set_password(password)

        # Sheriffs get a unique join code
        if is_sheriff:
            code = generate_join_code()
            while Pioneer.objects.filter(join_code=code).exists():
                code = generate_join_code()
            pioneer.join_code = code
        else:
            pioneer.sheriff = sheriff

        pioneer.save()

        msg = "Welcome, Sheriff! Share your join code with your cowboys." if is_sheriff else f"Welcome to {sheriff.username}'s Homestead, Cowboy!"
        response = JsonResponse({"pioneer": pioneer.to_dict(), "message": msg}, status=201)
        return create_session(pioneer, response)


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(View):
    def post(self, request):
        data = json.loads(request.body)
        username = data.get("username", "")
        password = data.get("password", "")

        if not username or not password:
            return JsonResponse({"error": "Username and password are required."}, status=400)

        try:
            pioneer = Pioneer.objects.get(username=username)
        except Pioneer.DoesNotExist:
            return JsonResponse({"error": "Wrong name or password, stranger."}, status=401)

        if not pioneer.check_password(password):
            return JsonResponse({"error": "Wrong name or password, stranger."}, status=401)

        msg = "Welcome back, Sheriff!" if pioneer.is_sheriff else "Back in the saddle, Cowboy!"
        response = JsonResponse({"pioneer": pioneer.to_dict(), "message": msg})
        return create_session(pioneer, response)


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(View):
    def post(self, request):
        token = request.COOKIES.get("frontier_session")
        if token:
            Session.objects.filter(token=token).delete()
        response = JsonResponse({"message": "Safe trails!"})
        response.delete_cookie("frontier_session")
        return response


class MeView(View):
    def get(self, request):
        pioneer = get_pioneer_from_request(request)
        if not pioneer:
            return JsonResponse({"error": "Not authenticated."}, status=401)
        return JsonResponse(pioneer.to_dict())
