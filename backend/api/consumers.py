from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.conf import settings
from rest_framework_simplejwt.backends import TokenBackend
from urllib.parse import parse_qs
from .models import ConversationMember, Message

def _user_id_from_token(token: str | None):
    if not token:
        return None
    try:
        backend = TokenBackend(
            algorithm=settings.SIMPLE_JWT.get("ALGORITHM", "HS256"),
            signing_key=settings.SIMPLE_JWT.get("SIGNING_KEY", settings.SECRET_KEY),
            verifying_key=settings.SIMPLE_JWT.get("VERIFYING_KEY", None),
            audience=settings.SIMPLE_JWT.get("AUDIENCE", None),
            issuer=settings.SIMPLE_JWT.get("ISSUER", None),
        )
        data = backend.decode(token, verify=True)
        return data.get("user_id")
    except Exception:
        return None

class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.conversation_id = int(self.scope["url_route"]["kwargs"]["conversation_id"])
        self.room = f"conv_{self.conversation_id}"

        # Expect ?token=ACCESS_JWT
        qs = parse_qs(self.scope.get("query_string", b"").decode())
        token = (qs.get("token") or [None])[0]
        self.user_id = _user_id_from_token(token)

        if not self.user_id or not await self._is_member(self.conversation_id, self.user_id):
            await self.close(); return

        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "send":
            msg = await self._persist(
                conversation_id=self.conversation_id,
                sender_id=self.user_id,
                kind=content.get("kind", "text"),
                text=content.get("text", ""),
                attachment_id=content.get("attachment_id"),
            )
            await self.channel_layer.group_send(self.room, {"type":"chat.message","payload":msg})

    async def chat_message(self, event):
        await self.send_json({"type": "message", "message": event["payload"]})

    # --- DB helpers (run in thread) ---
    @database_sync_to_async
    def _is_member(self, conversation_id: int, user_id: int) -> bool:
        return ConversationMember.objects.filter(conversation_id=conversation_id, user_id=user_id).exists()

    @database_sync_to_async
    def _persist(self, **kw):
        m = Message.objects.create(**kw)
        return {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "kind": m.kind,
            "text": m.text,
            "attachment_url": (m.attachment.file.url if m.attachment_id else None),
            "created_at": m.created_at.isoformat(),
        }
