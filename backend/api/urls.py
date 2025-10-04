from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


# api/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView,
    ProfileListCreateView, ProfileAvatarUploadView,
    DayEntryUpsertView, DayEntryUploadView, GenerateSummaryView,DayEntryDatesView
)

urlpatterns = [
    # auth
    path("register/", RegisterView.as_view(), name="register"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # profiles
    path("profiles/", ProfileListCreateView.as_view(), name="profiles_list_create"),
    path("profiles/<int:profile_id>/avatar/", ProfileAvatarUploadView.as_view(), name="profile_avatar"),

    # day entries (today default)
    path("profiles/<int:profile_id>/entries/", DayEntryUpsertView.as_view(), name="entry_upsert_get"),
    # upload photo to a specific entry
    path("profiles/<int:profile_id>/entries/<int:entry_id>/upload/", DayEntryUploadView.as_view(), name="entry_upload"),

    # generate story summary
    path("profiles/<int:profile_id>/entries/<int:entry_id>/summary/", GenerateSummaryView.as_view(), name="entry_summary"),
    path("profiles/<int:profile_id>/entries/dates/", DayEntryDatesView.as_view(), name="entry_dates"),

]
