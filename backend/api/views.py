from datetime import date as date_cls
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.renderers import JSONRenderer
import logging
import requests

from .models import Profile, DayEntry, Attachment
from .serializers import (
    RegisterSerializer,
    ProfileSerializer, DayEntrySerializer,
    AttachmentSerializer, GenerateSummarySerializer, UpsertDayEntrySerializer
)

User = get_user_model()
log = logging.getLogger(__name__)

# FastAPI Gemini service URL
GEMINI_SERVICE_URL = "http://localhost:8001/generate-summary"

# ---- Auth ----
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
    renderer_classes = [JSONRenderer]

    def get(self, request):
        qs = Profile.objects.filter(owner=request.user).order_by("-is_default", "name")
        data = ProfileSerializer(qs, many=True, context={'request': request}).data
        log.debug("profiles.list user_id=%s username=%s count=%d",
                  getattr(request.user, "id", None),
                  getattr(request.user, "username", None),
                  len(data))
        return Response(data)

    def post(self, request):
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"detail": "name required"}, status=400)
        is_default = bool(request.data.get("is_default"))
        prof = Profile.objects.create(owner=request.user, name=name, is_default=is_default)
        if is_default or Profile.objects.filter(owner=request.user).count() == 1:
            Profile.objects.filter(owner=request.user).exclude(id=prof.id).update(is_default=False)
            prof.is_default = True
            prof.save(update_fields=["is_default"])
        log.debug("profiles.create user_id=%s profile_id=%s name=%s",
                  getattr(request.user, "id", None), prof.id, prof.name)
        return Response(ProfileSerializer(prof, context={'request': request}).data, status=201)

class ProfileAvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, profile_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        f = request.FILES.get("file") or request.data.get("file")
        if not f:
            return Response({"detail": "file required"}, status=400)
        prof.avatar = f
        prof.save(update_fields=["avatar"])
        return Response(ProfileSerializer(prof, context={'request': request}).data)

# ---- Day entries (today by default) ----
class DayEntryUpsertView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, profile_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        ser = UpsertDayEntrySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data.get("date") or timezone.localdate()
        entry = _entry_for(prof, d)
        if "note" in ser.validated_data:
            entry.note = ser.validated_data["note"]
            entry.save(update_fields=["note"])
        return Response(DayEntrySerializer(entry, context={'request': request}).data, status=201)

    def get(self, request, profile_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        d_str = request.query_params.get("date")
        d = timezone.localdate() if not d_str else date_cls.fromisoformat(d_str)
        entry = _entry_for(prof, d)
        return Response(DayEntrySerializer(entry, context={'request': request}).data)

# ---- Add photos to entry ----
class DayEntryUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, profile_id: int, entry_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        entry = get_object_or_404(DayEntry, id=entry_id, profile=prof)
        f = request.FILES.get("file") or request.data.get("file")
        if not f:
            return Response({"detail": "file required"}, status=400)
        att = Attachment.objects.create(file=f, owner_profile=prof, day_entry=entry)
        entry = DayEntry.objects.get(id=entry.id)
        return Response({
            "attachment": AttachmentSerializer(att, context={'request': request}).data,
            "entry": DayEntrySerializer(entry, context={'request': request}).data
        }, status=201)

# ---- Generate AI story summary via FastAPI/Gemini ----
class GenerateSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, profile_id: int, entry_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        entry = get_object_or_404(DayEntry, id=entry_id, profile=prof)
        ser = GenerateSummarySerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        style = ser.validated_data["style"]

        note = (entry.note or "").strip()
        photo_count = entry.attachments.count()
        
        # Get image URLs for Gemini to analyze
        image_urls = [
            request.build_absolute_uri(att.file.url) 
            for att in entry.attachments.all()
        ]

        try:
            # Call FastAPI Gemini service
            response = requests.post(
                GEMINI_SERVICE_URL,
                json={
                    "note": note,
                    "photo_count": photo_count,
                    "image_urls": image_urls,
                    "style": style
                },
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            summary = data.get("summary", "")
            
            entry.summary_text = summary
            entry.save(update_fields=["summary_text"])
            
            return Response({"summary": entry.summary_text})
        
        except requests.exceptions.RequestException as e:
            log.error(f"Error calling Gemini service: {str(e)}")
            # Fallback to simple summary if AI service fails
            opener = {"short":"Today's moments:", "cheerful":"What a lovely day!", "nostalgic":"Another day to remember."}[style]
            parts = []
            if photo_count: 
                parts.append(f"I snapped {photo_count} photo{'s' if photo_count!=1 else ''}.")
            if note:
                parts.append((note[:220] + "…") if len(note) > 220 else note)
            closing = {"short":"Feeling grateful.", "cheerful":"Hope this brings a smile 😊", "nostalgic":"Thinking of the good old times."}[style]
            
            entry.summary_text = f"{opener} " + " ".join(parts) + f" {closing}"
            entry.save(update_fields=["summary_text"])
            return Response({"summary": entry.summary_text})

# ---- List recent day-entry dates for a profile ----
class DayEntryDatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, profile_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        limit = int(request.query_params.get("limit", 30))
        qs = (DayEntry.objects
              .filter(profile=prof)
              .annotate(attachments_count=Count("attachments"))
              .order_by("-date")[:limit])
        data = [{
            "entry_id": e.id,
            "date": e.date.isoformat(),
            "attachments_count": e.attachments_count,
            "note_preview": ((e.note[:80] + "…") if e.note and len(e.note) > 80 else (e.note or "")),
        } for e in qs]
        return Response(data)

class ProfileDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, profile_id: int):
        prof = _own_profile_or_404(request.user, profile_id)
        
        # Prevent deleting if it's the only profile
        if Profile.objects.filter(owner=request.user).count() == 1:
            return Response(
                {"detail": "Cannot delete your only profile"}, 
                status=400
            )
        
        prof_name = prof.name
        prof.delete()
        
        log.debug("profiles.delete user_id=%s profile_id=%s name=%s",
                  getattr(request.user, "id", None), profile_id, prof_name)
        
        return Response({"detail": "Profile deleted successfully"}, status=204)