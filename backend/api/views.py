# api/views.py
from datetime import date as date_cls
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser

from .models import Profile, DayEntry, Attachment
from .serializers import (
    RegisterSerializer, UserSerializer,
    ProfileSerializer, DayEntrySerializer, UpsertDayEntrySerializer,
    AttachmentSerializer, GenerateSummarySerializer,
)

User = get_user_model()

# ---- Auth (keep your JWT URLs as-is) ----
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

# ---- Helpers ----
def _own_profile_or_404(user, profile_id: int) -> Profile:
    return get_object_or_404(Profile, id=profile_id, owner=user)

def _entry_for(profile: Profile, d: date_cls) -> DayEntry:
    entry, _ = DayEntry.objects.get_or_create(profile=profile, date=d)
    return entry

# ---- Profiles ----
class ProfileListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Profile.objects.filter(owner=request.user).order_by("-is_default", "name")
        return Response(ProfileSerializer(qs, many=True).data)

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"detail": "name required"}, status=400)
        is_default = bool(request.data.get("is_default"))
        prof = Profile.objects.create(owner=request.user, name=name, is_default=is_default)
        # If first profile or is_default, clear others
        if is_default or Profile.objects.filter(owner=request.user).count() == 1:
            Profile.objects.filter(owner=request.user).exclude(id=prof.id).update(is_default=False)
            prof.is_default = True; prof.save(update_fields=["is_default"])
        return Response(ProfileSerializer(prof).data, status=201)

class ProfileAvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, profile_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        f = request.FILES.get("file")
        if not f: return Response({"detail":"file required"}, status=400)
        prof.avatar = f
        prof.save(update_fields=["avatar"])
        return Response(ProfileSerializer(prof).data)

# ---- Day entries (today by default) ----
class DayEntryUpsertView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, profile_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        ser = UpsertDayEntrySerializer(data=request.data); ser.is_valid(raise_exception=True)
        d = ser.validated_data.get("date") or timezone.localdate()
        entry = _entry_for(prof, d)
        if "note" in ser.validated_data:
            entry.note = ser.validated_data["note"]; entry.save(update_fields=["note"])
        return Response(DayEntrySerializer(entry).data, status=201)

    def get(self, request, profile_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        d_str = request.query_params.get("date")
        d = timezone.localdate() if not d_str else date_cls.fromisoformat(d_str)
        entry = _entry_for(prof, d)
        return Response(DayEntrySerializer(entry).data)

# ---- Add photos to entry ----
class DayEntryUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, profile_id: int, entry_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        entry = get_object_or_404(DayEntry, id=entry_id, profile=prof)
        f = request.FILES.get("file")
        if not f: return Response({"detail":"file required"}, status=400)
        att = Attachment.objects.create(file=f, owner_profile=prof, day_entry=entry)
        return Response(AttachmentSerializer(att).data, status=201)

# ---- Generate (sync) story summary ----
class GenerateSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, profile_id: int, entry_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        entry = get_object_or_404(DayEntry, id=entry_id, profile=prof)
        ser = GenerateSummarySerializer(data=request.data); ser.is_valid(raise_exception=True)
        style = ser.validated_data["style"]

        n = entry.attachments.count()
        note = (entry.note or "").strip()

        # very simple stub summary
        opener = {
            "short":     "Today’s moments:",
            "cheerful":  "What a lovely day!",
            "nostalgic": "Another day to remember.",
        }[style]

        parts = []
        if n: parts.append(f"I snapped {n} photo{'s' if n!=1 else ''}.")
        if note:
            note_short = (note[:220] + "…") if len(note) > 220 else note
            parts.append(note_short)
        closing = {
            "short":     "Feeling grateful.",
            "cheerful":  "Hope this brings a smile 😊",
            "nostalgic": "Thinking of the good old times.",
        }[style]

        entry.summary_text = f"{opener} " + " ".join(parts) + f" {closing}"
        entry.save(update_fields=["summary_text"])
        return Response({"summary": entry.summary_text})

# --- List recent day-entry dates for a profile ---
class DayEntryDatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, profile_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        limit = int(request.query_params.get("limit", 30))
        qs = (DayEntry.objects
              .filter(profile=prof)
              .order_by("-date")[:limit])
        data = [{
            "entry_id": e.id,
            "date": e.date.isoformat(),
            "attachments_count": e.attachments.count(),
            "note_preview": ((e.note[:80] + "…") if e.note and len(e.note) > 80 else (e.note or "")),
        } for e in qs]
        return Response(data)
