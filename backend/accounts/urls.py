from django.urls import path
from .views import RegisterView, MeView, MemberListView, PasswordResetRequestView, PasswordResetVerifyView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("members/", MemberListView.as_view(), name="members"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset-verify/", PasswordResetVerifyView.as_view(), name="password-reset-verify"),
]
