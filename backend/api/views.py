from django.shortcuts import render
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser


# Create your views here.

from rest_framework import generics, permissions, status
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

#token_authentication = ['rest_framework.authentication.TokenAuthentication']
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication  # Import the correct class

from rest_framework.permissions import IsAuthenticated
from django.db.models import F
from .models import Conversation, ConversationMember, Message, Attachment
from .ws import send_ws_message


User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

class ConversationsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        conv_ids = ConversationMember.objects.filter(user=request.user).values_list("conversation_id", flat=True)
        data = []
        for cid in conv_ids:
            last = Message.objects.filter(conversation_id=cid).order_by("-created_at").first()
            data.append({
                "id": cid,
                "last": (last.text if last else ""),
                "last_at": (last.created_at if last else None),
            })
        return Response(sorted(data, key=lambda d: d["last_at"] or timezone.datetime.min, reverse=True))

class CreateConversationView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        other_id = int(request.data["participant_user_id"])
        if other_id == request.user.id:
            return Response({"detail":"cannot create with self"}, status=400)
        c = Conversation.objects.create()
        ConversationMember.objects.bulk_create([
            ConversationMember(conversation=c, user=request.user),
            ConversationMember(conversation=c, user_id=other_id),
        ])
        return Response({"id": c.id}, status=201)

def _is_member(user, conversation_id) -> bool:
    return ConversationMember.objects.filter(user=user, conversation_id=conversation_id).exists()

class MessagesView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, conversation_id: int):
        if not _is_member(request.user, conversation_id):
            return Response(status=403)
        qs = Message.objects.filter(conversation_id=conversation_id).order_by("-created_at")[:50]
        data = [{
            "id": m.id, "conversation_id": m.conversation_id, "sender_id": m.sender_id,
            "kind": m.kind, "text": m.text,
            "attachment_url": (m.attachment.file.url if m.attachment else None),
            "created_at": m.created_at
        } for m in qs[::-1]]
        return Response(data)

class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        cid = int(request.data["conversation_id"])
        if not _is_member(request.user, cid):
            return Response(status=403)
        msg = Message.objects.create(
            conversation_id=cid,
            sender=request.user,
            kind=request.data.get("kind", "text"),
            text=request.data.get("text", ""),
            attachment_id=request.data.get("attachment_id")
        )
        send_ws_message(cid, {
            "id": msg.id, "conversation_id": cid, "sender_id": request.user.id,
            "kind": msg.kind, "text": msg.text,
            "attachment_url": (msg.attachment.file.url if msg.attachment else None),
            "created_at": msg.created_at.isoformat(),
        })
        return Response({"id": msg.id}, status=201)

class UploadAttachmentView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)  # <-- use classes

    def post(self, request):
        f = request.FILES.get("file")
        if not f:
            return Response({"detail": "file required"}, status=400)
        att = Attachment.objects.create(file=f)
        return Response({"id": att.id, "url": att.file.url}, status=201)

# --- Minimal “AI draft” stub (sync, no model calls) ---
class AIDraftView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        ramble = (request.data.get("ramble") or "").strip()
        n_imgs = len(request.data.get("attachment_ids") or [])
        parts = []
        if n_imgs: parts.append(f"I added {n_imgs} photo{'s' if n_imgs != 1 else ''} from today.")
        if ramble:
            short = (ramble[:150] + "…") if len(ramble) > 150 else ramble
            parts.append("Something I’ve been thinking about: " + short)
        draft = "Hi Grandpa! " + " ".join(parts) + " Hope you’re doing well. What did you do today?"
        return Response({"draft": draft})

class ApproveDraftView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        cid = int(request.data["conversation_id"])
        if not _is_member(request.user, cid):
            return Response(status=403)
        text = request.data.get("draft_text", "").strip()
        if not text:
            return Response({"detail":"draft_text required"}, status=400)
        msg = Message.objects.create(conversation_id=cid, sender=request.user, kind="ai_draft", text=text)
        send_ws_message(cid, {
            "id": msg.id, "conversation_id": cid, "sender_id": request.user.id,
            "kind": "ai_draft", "text": msg.text, "attachment_url": None,
            "created_at": msg.created_at.isoformat(),
        })
        return Response({"id": msg.id}, status=201)