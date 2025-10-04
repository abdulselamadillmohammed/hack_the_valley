import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getToken } from "../auth";
import {
  listDates,
  getEntry,
  getOrCreateTodayEntry,
  uploadPhoto,
  generateSummary,
} from "../api";

type DateItem = {
  entry_id: number;
  date: string;
  attachments_count: number;
  note_preview: string;
};
type Attachment = { id: number; url: string };
type Entry = {
  id: number;
  date: string;
  note: string;
  summary_text: string;
  attachments: Attachment[];
};

export default function ProfilePage() {
  const { id } = useParams();
  const profileId = Number(id);
  const nav = useNavigate();

  const [token, setToken] = useState<string | null>(null);
  const [dates, setDates] = useState<DateItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [entry, setEntry] = useState<Entry | null>(null);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  // auth gate + load recent dates
  useEffect(() => {
    const t = getToken();
    if (!t) {
      nav("/login");
      return;
    }
    setToken(t);

    (async () => {
      try {
        const rows = await listDates(t, profileId);
        setDates(rows);
      } catch (e: any) {
        setMsg(String(e?.message ?? e));
      }
    })();
  }, [nav, profileId]);

  async function load(dateISO: string) {
    if (!token) return;
    try {
      const e: Entry = await getEntry(token, profileId, dateISO);
      setEntry(e);
      setSelectedDate(dateISO);
      setNote(e.note || "");
    } catch (e: any) {
      setMsg(String(e?.message ?? e));
    }
  }

  async function today() {
    if (!token) return;
    try {
      const e: Entry = await getOrCreateTodayEntry(token, profileId);
      setEntry(e);
      setSelectedDate(e.date);
      setNote(e.note || "");
      setDates((prev) =>
        prev.find((d) => d.date === e.date)
          ? prev
          : [
              {
                entry_id: e.id,
                date: e.date,
                attachments_count: e.attachments?.length || 0,
                note_preview: e.note || "",
              },
              ...prev,
            ]
      );
    } catch (e: any) {
      setMsg(String(e?.message ?? e));
    }
  }

  async function saveNote() {
    if (!token || !selectedDate) return;
    try {
      // our simple API updates when posting to today's entry;
      // for other dates you can extend the API later
      await getOrCreateTodayEntry(token, profileId, note);
      if (entry) {
        const refreshed: Entry = await getEntry(token, profileId, entry.date);
        setEntry(refreshed);
      }
    } catch (e: any) {
      setMsg(String(e?.message ?? e));
    }
  }

  async function addPhoto(files: FileList | null) {
    if (!token || !entry || !files || files.length === 0) return;
    try {
      await uploadPhoto(token, profileId, entry.id, files[0]);
      const refreshed: Entry = await getEntry(token, profileId, entry.date);
      setEntry(refreshed);
    } catch (e: any) {
      setMsg(String(e?.message ?? e));
    }
  }

  async function makeSummary(style: "short" | "cheerful" | "nostalgic") {
    if (!token || !entry) return;
    try {
      await generateSummary(token, profileId, entry.id, style);
      const refreshed: Entry = await getEntry(token, profileId, entry.date);
      setEntry(refreshed);
    } catch (e: any) {
      setMsg(String(e?.message ?? e));
    }
  }

  return (
    <div className="wrap">
      <div className="row space">
        <h1>Profile #{profileId}</h1>
        <button onClick={() => nav("/profiles")}>Back</button>
      </div>

      {/* Dates row */}
      <div className="row-scroll">
        <button className="chip primary" onClick={today}>
          Today
        </button>
        {dates.map((d) => (
          <button
            key={d.date}
            className={`chip ${selectedDate === d.date ? "active" : ""}`}
            onClick={() => load(d.date)}
          >
            {d.date} {d.attachments_count ? `(${d.attachments_count})` : ""}
          </button>
        ))}
      </div>

      {/* Entry editor */}
      {entry ? (
        <>
          <div className="card">
            <h3>{entry.date}</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add notes about the day…"
              rows={5}
            />
            <div className="row gap">
              <button onClick={saveNote}>Save note</button>
              <label className="btn">
                Add photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => addPhoto(e.target.files)}
                  hidden
                />
              </label>
              <div className="spacer" />
              <button onClick={() => makeSummary("short")}>Summary</button>
              <button onClick={() => makeSummary("cheerful")}>Cheerful</button>
              <button onClick={() => makeSummary("nostalgic")}>
                Nostalgic
              </button>
            </div>
          </div>

          {!!entry.attachments?.length && (
            <div className="grid">
              {entry.attachments.map((a) => (
                <div key={a.id} className="tile">
                  <img src={a.url} alt="" />
                </div>
              ))}
            </div>
          )}

          {entry.summary_text && (
            <div className="card">
              <h3>Story</h3>
              <p>{entry.summary_text}</p>
            </div>
          )}
        </>
      ) : (
        <div className="card">
          <p>Select a date (or press “Today”) to start.</p>
        </div>
      )}

      {msg && <p className="err">{msg}</p>}
    </div>
  );
}
