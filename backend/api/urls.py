from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


# from .views import (
#     RegisterView,
#     ConversationsView, CreateConversationView,
#     MessagesView, SendMessageView,
#     UploadAttachmentView,
#     AIDraftView, ApproveDraftView,
#     SearchUsersView, FollowUserView, UnfollowUserView,
#     MyFollowersView, MyFollowingView,
# )

# urlpatterns = [
#     # auth
#     path('register/', RegisterView.as_view(), name='register'),
#     path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
#     path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

#     # users / follow
#     path('users/search/', SearchUsersView.as_view(), name='users_search'),
#     path('users/follow/', FollowUserView.as_view(), name='users_follow'),               # POST {user_id}
#     path('users/follow/<int:user_id>/', UnfollowUserView.as_view(), name='users_unfollow'),  # DELETE
#     path('users/followers/', MyFollowersView.as_view(), name='my_followers'),
#     path('users/following/', MyFollowingView.as_view(), name='my_following'),

#     # chat
#     path('conversations/', ConversationsView.as_view(), name='conversations'),
#     path('conversations/create/', CreateConversationView.as_view(), name='conversations_create'),
#     path('messages/<int:conversation_id>/', MessagesView.as_view(), name='messages_get'),
#     path('messages/send/', SendMessageView.as_view(), name='messages_send'),
#     path('attachments/upload/', UploadAttachmentView.as_view(), name='attachments_upload'),

#     # AI stub
#     path('ai/draft/', AIDraftView.as_view(), name='ai_draft'),
#     path('ai/draft/approve/', ApproveDraftView.as_view(), name='ai_draft_approve'),
# ]


# api/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView,
    ProfileListCreateView, ProfileAvatarUploadView,
    DayEntryUpsertView, DayEntryUploadView, GenerateSummaryView,
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
]
