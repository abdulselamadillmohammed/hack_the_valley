import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getToken,
  clearToken,
  getActiveProfileId,
  setActiveProfileId,
} from "../auth";
import {
  getEntry,
  upsertEntry,
  uploadPhoto,
  generateSummary,
  listDates,
} from "../api";

type DayEntry = {
  id: number;
  date: string;
  note: string;
  summary_text: string;
  attachments: Array<{ id: number; url: string; created_at: string }>;
  created_at: string;
  updated_at: string;
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
  const [summary, setSummary] = useState("");
  const [summaryStyle, setSummaryStyle] = useState<
    "short" | "cheerful" | "nostalgic"
  >("short");
  const [recentDates, setRecentDates] = useState<DateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [err, setErr] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setErr("");
    setLoading(true);
    try {
      const data = await getEntry(tok, pid, dateISO);
      setEntry(data);
      setNote(data.note || "");
      setSummary(data.summary_text || "");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentDates(tok: string, pid: number) {
    try {
      const data = await listDates(tok, pid, 30);
      setRecentDates(data || []);
    } catch (e: any) {
      console.error("Failed to load recent dates", e);
    }
  }

  async function saveNote() {
    if (!token || !profileId || !entry) return;
    setErr("");
    setLoading(true);
    try {
      const data = await upsertEntry(token, profileId, currentDate, note);
      setEntry(data);
      setSummary(data.summary_text || "");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!token || !profileId || !entry) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setErr("");
    setUploadingPhoto(true);
    try {
      const resp = await uploadPhoto(token, profileId, entry.id, file);
      setEntry(resp.entry);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleGenerateSummary() {
    if (!token || !profileId || !entry) return;
    setErr("");
    setGeneratingSummary(true);
    try {
      const resp = await generateSummary(
        token,
        profileId,
        entry.id,
        summaryStyle
      );
      setSummary(resp.summary);
      if (token && profileId) {
        await loadEntry(token, profileId, currentDate);
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setGeneratingSummary(false);
    }
  }

  function changeDate(dateISO: string) {
    setCurrentDate(dateISO);
  }

  function goToToday() {
    setCurrentDate(new Date().toISOString().split("T")[0]);
  }

  return (
    <div className="journal-container">
      {/* Header */}
      <div className="journal-header">
        <h1>My Journal</h1>
        <div className="header-actions">
          <button onClick={() => nav("/profiles")}>Change Profile</button>
          <button
            onClick={() => {
              clearToken();
              setActiveProfileId(null);
              nav("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {err && <p className="err">{err}</p>}

      {/* Main content */}
      <div className="journal-content">
        {/* Left sidebar - Recent entries */}
        <div className="sidebar">
          <h2>Recent Entries</h2>
          <button onClick={goToToday} className="today-btn">
            Today
          </button>
          <div className="recent-list">
            {recentDates.map((d) => (
              <button
                key={d.entry_id}
                className={`date-item ${
                  d.date === currentDate ? "active" : ""
                }`}
                onClick={() => changeDate(d.date)}
              >
                <div className="date-label">{d.date}</div>
                <div className="date-preview">
                  {d.attachments_count > 0 && (
                    <span className="photo-count">
                      {d.attachments_count} photos
                    </span>
                  )}
                  {d.note_preview && (
                    <div className="note-snippet">{d.note_preview}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main journal area */}
        <div className="journal-main">
          <div className="date-selector">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => changeDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Note area */}
          <div className="note-section">
            <h3>My thoughts for {currentDate}</h3>
            <textarea
              className="note-input"
              placeholder="Write about your day..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={10}
            />
            <button onClick={saveNote} disabled={loading} className="save-btn">
              {loading ? "Saving..." : "Save Note"}
            </button>
          </div>

          {/* Photos - MORE PROMINENT */}
          <div className="photos-section">
            <div className="photos-header">
              <h3>Photos of the Day</h3>
              <span className="photo-count-badge">
                {entry?.attachments.length || 0} photo
                {entry?.attachments.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* PROMINENT UPLOAD BUTTON */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto || !entry}
              className="upload-btn-big"
            >
              {uploadingPhoto ? (
                <>Uploading...</>
              ) : (
                <>
                  <span className="upload-icon">+</span>
                  <span>Add Photo</span>
                </>
              )}
            </button>

            {/* Photo Grid */}
            {entry?.attachments && entry.attachments.length > 0 ? (
              <div className="photo-grid">
                {entry.attachments.map((att) => (
                  <div key={att.id} className="photo-item">
                    <img src={att.url} alt="Memory" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-photos">
                <p>No photos yet for this day</p>
                <p className="hint">
                  Click "Add Photo" above to upload memories
                </p>
              </div>
            )}
          </div>

          {/* Summary generation */}
          <div className="summary-section">
            <h3>AI Story Summary</h3>
            <div className="style-selector">
              <label>
                <input
                  type="radio"
                  value="short"
                  checked={summaryStyle === "short"}
                  onChange={(e) => setSummaryStyle(e.target.value as any)}
                />
                Short
              </label>
              <label>
                <input
                  type="radio"
                  value="cheerful"
                  checked={summaryStyle === "cheerful"}
                  onChange={(e) => setSummaryStyle(e.target.value as any)}
                />
                Cheerful
              </label>
              <label>
                <input
                  type="radio"
                  value="nostalgic"
                  checked={summaryStyle === "nostalgic"}
                  onChange={(e) => setSummaryStyle(e.target.value as any)}
                />
                Nostalgic
              </label>
            </div>
            <button
              onClick={handleGenerateSummary}
              disabled={generatingSummary || !entry}
              className="generate-btn"
            >
              {generatingSummary ? "Generating with AI..." : "Generate Story"}
            </button>
            {summary && (
              <div className="summary-display">
                <p>{summary}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
