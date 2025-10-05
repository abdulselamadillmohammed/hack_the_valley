import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getToken,
  getActiveProfileId,
  setActiveProfileId,
  clearToken,
} from "../auth";
import {
  getEntry,
  upsertEntry,
  uploadPhoto,
  generateSummary,
  listDates,
} from "../api";

type Attachment = { id: number; url: string; created_at: string };
type DayEntry = {
  id: number;
  date: string;
  note: string;
  summary_text: string;
  attachments: Attachment[];
};
type DateItem = {
  entry_id: number;
  date: string;
  attachments_count: number;
  note_preview: string;
};

export default function Journal() {
  const nav = useNavigate();
  const [token, setTokenState] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [entry, setEntry] = useState<DayEntry | null>(null);
  const [note, setNote] = useState("");
  const [recentDates, setRecentDates] = useState<DateItem[]>([]);
  const [summaryStyle, setSummaryStyle] = useState<
    "short" | "cheerful" | "nostalgic"
  >("cheerful");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const t = getToken();
    const pid = getActiveProfileId();
    if (!t) {
      nav("/login");
      return;
    }
    if (!pid) {
      nav("/profiles");
      return;
    }
    setTokenState(t);
    setProfileId(pid);
    loadEntry(t, pid, currentDate);
    loadRecentDates(t, pid);
  }, [nav, currentDate]);

  async function loadEntry(tok: string, pid: number, dateISO: string) {
    setLoading(true);
    setError("");
    try {
      const data = await getEntry(tok, pid, dateISO);
      setEntry(data);
      setNote(data.note || "");
    } catch (e: any) {
      setError(e?.message || "Failed to load entry");
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentDates(tok: string, pid: number) {
    try {
      const data = await listDates(tok, pid, 20);
      setRecentDates(data || []);
    } catch (e) {
      console.error("Failed to load recent dates");
    }
  }

  async function handleSaveNote() {
    if (!token || !profileId) return;
    setLoading(true);
    setError("");
    try {
      const data = await upsertEntry(token, profileId, currentDate, note);
      setEntry(data);
    } catch (e: any) {
      setError(e?.message || "Failed to save note");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!token || !profileId || !entry) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const resp = await uploadPhoto(token, profileId, entry.id, file);
      setEntry(resp.entry);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: any) {
      setError(e?.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  }

  async function handleGenerateSummary() {
    if (!token || !profileId || !entry) return;
    setGenerating(true);
    setError("");
    try {
      await generateSummary(token, profileId, entry.id, summaryStyle);
      await loadEntry(token, profileId, currentDate);
    } catch (e: any) {
      setError(e?.message || "Failed to generate summary");
    } finally {
      setGenerating(false);
    }
  }

  async function handlePlaySummary() {
    if (!entry?.summary_text) return;

    setPlayingAudio(true);
    setError("");

    try {
      // Get API key from environment variable or hardcode for hackathon
      const ELEVENLABS_API_KEY =
        import.meta.env.VITE_ELEVENLABS_API_KEY ||
        "YOUR_ELEVENLABS_API_KEY_HERE";

      const response = await fetch(
        "https://api.elevenlabs.io/v1/text-to-speech/JBFqnCBsd6RMkjVDRZzb",
        {
          method: "POST",
          headers: {
            Accept: "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: entry.summary_text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Play new audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingAudio(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setPlayingAudio(false);
        setError("Failed to play audio");
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (e: any) {
      setError(e?.message || "Failed to play summary");
      setPlayingAudio(false);
    }
  }

  function handleStopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingAudio(false);
  }

  function handleDateChange(dateISO: string) {
    setCurrentDate(dateISO);
  }

  return (
    <div className="journal-page">
      {/* Header */}
      <div className="journal-header">
        <h1 className="logo">ReminAI</h1>
        <div className="header-actions">
          <button onClick={() => nav("/profiles")} className="btn-secondary">
            Switch Profile
          </button>
          <button
            onClick={() => {
              clearToken();
              setActiveProfileId(null);
              nav("/login");
            }}
            className="btn-logout"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="journal-container">
        {/* Sidebar */}
        <div className="journal-sidebar">
          <h3>Recent Entries</h3>
          <button
            onClick={() =>
              handleDateChange(new Date().toISOString().split("T")[0])
            }
            className="btn-today"
          >
            Today
          </button>
          <div className="dates-list">
            {recentDates.map((d) => (
              <button
                key={d.entry_id}
                className={`date-item ${
                  d.date === currentDate ? "active" : ""
                }`}
                onClick={() => handleDateChange(d.date)}
              >
                <div className="date-item-date">
                  {new Date(d.date).toLocaleDateString()}
                </div>
                {d.attachments_count > 0 && (
                  <div className="date-item-photos">
                    {d.attachments_count} photos
                  </div>
                )}
                {d.note_preview && (
                  <div className="date-item-preview">{d.note_preview}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="journal-main">
          {error && <div className="error-message">{error}</div>}

          {/* Date Picker */}
          <div className="date-picker">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
            <h2>
              {new Date(currentDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
          </div>

          {/* Photos Section */}
          <div className="photos-section">
            <div className="section-header">
              <h3>Photos</h3>
              <span className="photo-count">
                {entry?.attachments.length || 0}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: "none" }}
            />

            {entry?.attachments && entry.attachments.length > 0 ? (
              <div className="photos-grid">
                {entry.attachments.map((att) => (
                  <div key={att.id} className="photo-item">
                    <img src={att.url} alt="Memory" />
                  </div>
                ))}
                <button
                  className="photo-add-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "..." : "+"}
                </button>
              </div>
            ) : (
              <div
                className="photos-empty"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="photos-empty-icon">📷</div>
                <p>No photos yet</p>
                <button className="btn-primary" disabled={uploading}>
                  {uploading ? "Uploading..." : "Add Photo"}
                </button>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="notes-section">
            <h3>My Thoughts</h3>
            <textarea
              placeholder="What happened today? How did you feel?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={8}
            />
            <button
              onClick={handleSaveNote}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Note"}
            </button>
          </div>

          {/* Summary Section */}
          <div className="summary-section">
            <h3>AI Story Summary</h3>
            <div className="summary-styles">
              {(["short", "cheerful", "nostalgic"] as const).map((style) => (
                <label key={style} className="style-option">
                  <input
                    type="radio"
                    name="style"
                    value={style}
                    checked={summaryStyle === style}
                    onChange={(e) => setSummaryStyle(e.target.value as any)}
                  />
                  <span>{style.charAt(0).toUpperCase() + style.slice(1)}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleGenerateSummary}
              className="btn-generate"
              disabled={generating || !entry}
            >
              {generating ? "Generating..." : "✨ Generate Story"}
            </button>
            {entry?.summary_text && (
              <div className="summary-result">
                <p>{entry.summary_text}</p>
                <div className="audio-controls">
                  {!playingAudio ? (
                    <button
                      onClick={handlePlaySummary}
                      className="btn-play-audio"
                    >
                      🔊 Play Summary
                    </button>
                  ) : (
                    <button
                      onClick={handleStopAudio}
                      className="btn-stop-audio"
                    >
                      ⏸ Stop
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
