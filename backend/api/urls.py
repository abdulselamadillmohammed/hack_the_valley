from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView,
    ConversationsView, CreateConversationView,
    MessagesView, SendMessageView,
    UploadAttachmentView,
    AIDraftView, ApproveDraftView,
)

# urlpatterns = [
#     path('register/', RegisterView.as_view(), name='register'),
#     path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
#     path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
# ]

urlpatterns = [
    # existing auth routes...
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # chat routes
    path('conversations/', ConversationsView.as_view(), name='conversations'),
    path('conversations/create/', CreateConversationView.as_view(), name='conversations_create'),
    path('messages/<int:conversation_id>/', MessagesView.as_view(), name='messages_get'),
    path('messages/send/', SendMessageView.as_view(), name='messages_send'),
    path('attachments/upload/', UploadAttachmentView.as_view(), name='attachments_upload'),

    # “AI draft” (synchronous stub)
    path('ai/draft/', AIDraftView.as_view(), name='ai_draft'),
    path('ai/draft/approve/', ApproveDraftView.as_view(), name='ai_draft_approve'),
]