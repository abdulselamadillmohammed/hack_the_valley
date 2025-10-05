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

type EntryWithDetails = DateItem & {
  firstImageUrl?: string;
  loaded: boolean;
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
  const [recentDates, setRecentDates] = useState<EntryWithDetails[]>([]);
  const [summaryStyle, setSummaryStyle] = useState<
    "short" | "cheerful" | "nostalgic"
  >("cheerful");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

    // At this point, TypeScript knows t and pid are not null
    const token: string = t;
    const profileIdValue: number = pid;

    setTokenState(token);
    setProfileId(profileIdValue);

    async function load() {
      await loadEntry(token, profileIdValue, currentDate);
      await loadRecentDates(token, profileIdValue);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const entriesWithDetails: EntryWithDetails[] = (data || []).map(
        (d: DateItem) => ({
          ...d,
          loaded: false,
        })
      );
      setRecentDates(entriesWithDetails);

      // Load images for entries with attachments
      entriesWithDetails.forEach(async (entryItem, index) => {
        if (entryItem.attachments_count > 0) {
          try {
            const entryData = await getEntry(tok, pid, entryItem.date);
            if (entryData.attachments && entryData.attachments.length > 0) {
              setRecentDates((prev) => {
                const updated = [...prev];
                if (updated[index]) {
                  updated[index] = {
                    ...updated[index],
                    firstImageUrl: entryData.attachments[0].url,
                    loaded: true,
                  };
                }
                return updated;
              });
            }
          } catch (e) {
            console.error("Failed to load entry image", e);
          }
        }
      });
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
      await loadRecentDates(token, profileId);
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
      await loadRecentDates(token, profileId);
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
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(entry.summary_text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => {
          setPlayingAudio(false);
        };

        utterance.onerror = () => {
          setError("Failed to play audio");
          setPlayingAudio(false);
        };

        speechSynthesis.speak(utterance);
      } else {
        throw new Error("Speech synthesis not supported");
      }
    } catch (e: any) {
      console.error("Audio error:", e);
      setError(e?.message || "Failed to play summary");
      setPlayingAudio(false);
    }
  }

  function handleStopAudio() {
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
    }
    setPlayingAudio(false);
  }

  function handleDateChange(dateISO: string) {
    setCurrentDate(dateISO);
  }

  const featuredEntry = recentDates.length > 0 ? recentDates[0] : null;
  const remainingEntries = recentDates.length > 1 ? recentDates.slice(1) : [];

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

      <div className="journal-layout">
        {/* Hero/Featured Entry */}
        {featuredEntry && (
          <div className="journal-hero">
            <div className="hero-content">
              <div className="hero-info">
                <h2 className="hero-title">Most Recent Entry</h2>
                <h3 className="hero-date">
                  {new Date(featuredEntry.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                {featuredEntry.note_preview && (
                  <p className="hero-preview">{featuredEntry.note_preview}</p>
                )}
                <div className="hero-buttons">
                  <button
                    onClick={() => handleDateChange(featuredEntry.date)}
                    className="btn-hero-view"
                  >
                    {featuredEntry.date === currentDate
                      ? "Currently Viewing"
                      : "View Entry"}
                  </button>
                  {featuredEntry.date === currentDate &&
                    entry?.summary_text && (
                      <button
                        onClick={
                          playingAudio ? handleStopAudio : handlePlaySummary
                        }
                        className="btn-hero-play"
                      >
                        {playingAudio ? "⏸ Stop" : "🔊 Play Summary"}
                      </button>
                    )}
                </div>
              </div>
              <div className="hero-image">
                {featuredEntry.firstImageUrl ? (
                  <img src={featuredEntry.firstImageUrl} alt="Featured entry" />
                ) : (
                  <div className="hero-placeholder">
                    <span className="hero-placeholder-icon">📝</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Horizontal Scroll Section */}
        {remainingEntries.length > 0 && (
          <div className="entries-carousel-section">
            <h3 className="carousel-title">My Entries</h3>
            <div className="entries-carousel" ref={scrollContainerRef}>
              <div className="carousel-track">
                {remainingEntries.map((d) => (
                  <div
                    key={`entry-${d.entry_id}`}
                    className={`carousel-entry ${
                      d.date === currentDate ? "active" : ""
                    }`}
                    onClick={() => handleDateChange(d.date)}
                  >
                    <div className="carousel-thumbnail">
                      {d.firstImageUrl ? (
                        <img src={d.firstImageUrl} alt="Entry thumbnail" />
                      ) : (
                        <div className="carousel-placeholder">
                          <span className="carousel-icon">📝</span>
                        </div>
                      )}
                      <div className="carousel-overlay">
                        <div className="carousel-date">
                          {new Date(d.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        {d.note_preview && (
                          <div className="carousel-preview">
                            {d.note_preview}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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
