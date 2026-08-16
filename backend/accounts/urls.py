from django.urls import path
from .views import RegisterView, MeView, MemberListView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("members/", MemberListView.as_view(), name="members"),
]
