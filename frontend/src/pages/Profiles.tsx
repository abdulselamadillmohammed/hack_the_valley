// src/pages/Profiles.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API, getProfiles, createProfile } from "../api";
import { getToken, clearToken, setActiveProfileId } from "../auth";

type Profile = {
  id: number;
  name: string;
  is_default?: boolean;
  created_at?: string;
  avatar_url?: string | null;
};

function normalizeProfiles(resp: any): Profile[] {
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp.results)) return resp.results;
  return [];
}

export default function Profiles() {
  const nav = useNavigate();
  const [token, setTokenState] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadProfiles(tok: string) {
    setErr("");
    setLoading(true);
    try {
      // primary path via helper
      const raw = await getProfiles(tok);
      const list = normalizeProfiles(raw);
      if (
        !Array.isArray(list) ||
        !list.every((p) => typeof p?.id === "number")
      ) {
        throw new Error("Profiles API did not return an array");
      }
      setProfiles(list);
    } catch (e: any) {
      // fallback raw fetch to eliminate helper issues & surface exact server text
      try {
        const r = await fetch(`${API}/profiles/`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${tok}`,
          },
        });
        const text = await r.text();
        if (!r.ok) throw new Error(`[${r.status}] ${text}`);
        const parsed = JSON.parse(text);
        const list = normalizeProfiles(parsed);
        setProfiles(list);
      } catch (e2: any) {
        setProfiles([]);
        setErr(String(e2?.message ?? e2));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = getToken();
    if (!t) {
      nav("/login");
      return;
    }
    setTokenState(t);
    loadProfiles(t);
  }, [nav]);

  async function add() {
    if (!token || !name.trim()) return;
    setErr("");
    setLoading(true);
    try {
      const p = await createProfile(token, name.trim(), profiles.length === 0);
      setName("");
      // make it active locally so user sees it immediately
      setActiveProfileId(p?.id);
      // refresh from server to be authoritative
      await loadProfiles(token);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  function selectProfile(p: Profile) {
    // set active but DO NOT navigate anywhere (you removed Profile page)
    setActiveProfileId(p.id);
  }

  return (
    <div className="wrap">
      <div className="row space">
        <h1>Choose a profile</h1>
        <div className="row gap">
          <button
            onClick={() => token && loadProfiles(token)}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={() => {
              clearToken();
              nav("/login");
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Visible error from server if any */}
      {err && (
        <p className="err" style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
          {err}
        </p>
      )}

      {/* Profiles grid */}
      <div className="grid" style={{ marginTop: 12 }}>
        {profiles.length === 0 && !loading ? (
          <div className="card">
            <p>No profiles yet. Create one below.</p>
          </div>
        ) : (
          profiles.map((p) => (
            <button
              key={p.id}
              className="tile"
              onClick={() => selectProfile(p)}
            >
              {p.avatar_url ? (
                <img className="avatar" src={p.avatar_url} alt="" />
              ) : (
                <div className="avatar" />
              )}
              <div className="name">
                {p.name}
                {p.is_default ? " ★" : ""}
              </div>
              <div className="sub">
                {p.created_at?.slice(0, 19).replace("T", " ")}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Create profile */}
      <div className="card" style={{ marginTop: 16 }}>
        <input
          placeholder="New profile name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={add} disabled={!name.trim() || loading}>
          {loading ? "Adding…" : "Add Profile"}
        </button>
      </div>
    </div>
  );
}
