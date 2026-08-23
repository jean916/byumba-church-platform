from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/accounts/", include("accounts.urls")),
    path("api/dioceses/", include("dioceses.urls")),
    path("api/content/", include("content.urls")),
    path("api/offerings/", include("offerings.urls")),
]

# Serve uploaded photos (parish/group/clergy images, etc). Django's own
# static() helper from django.conf.urls.static refuses to do this when
# DEBUG=False (it's hard-coded to no-op in production, regardless of any
# "if DEBUG" wrapper around it) - so this bypasses that by using the
# underlying view directly instead. Fine for a small site like this one;
# a larger deployment would move media to cloud storage instead.
urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
