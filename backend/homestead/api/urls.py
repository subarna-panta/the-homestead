from django.urls import path
from .views_auth import SignupView, LoginView, LogoutView, MeView
from .views_bounties import (
    BountiesView, BountyDetailView, ClaimBountyView,
    PendingClaimsView, ApproveClaimView, DeclineClaimView
)
from .views_store import (
    StoreView, StoreItemsAdminView, StoreItemDetailView,
    LeaderboardView, PurchasesAdminView, PurchaseActionView
)

urlpatterns = [
    path("auth/signup", SignupView.as_view()),
    path("auth/login", LoginView.as_view()),
    path("auth/logout", LogoutView.as_view()),
    path("auth/me", MeView.as_view()),

    path("bounties", BountiesView.as_view()),
    path("bounties/pending-claims", PendingClaimsView.as_view()),
    path("bounties/<int:bounty_id>", BountyDetailView.as_view()),
    path("bounties/<int:bounty_id>/claim", ClaimBountyView.as_view()),
    path("bounties/<int:claim_id>/approve", ApproveClaimView.as_view()),
    path("bounties/<int:claim_id>/decline", DeclineClaimView.as_view()),

    path("store", StoreView.as_view()),
    path("store/admin", StoreItemsAdminView.as_view()),
    path("store/admin/<int:item_id>", StoreItemDetailView.as_view()),
    path("store/purchases", PurchasesAdminView.as_view()),
    path("store/purchases/<int:purchase_id>/action", PurchaseActionView.as_view()),

    path("leaderboard", LeaderboardView.as_view()),
]
