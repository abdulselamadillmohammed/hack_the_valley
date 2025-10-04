import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfiles, createProfile } from "../api";
import { getToken, clearToken } from "../auth";

export default function Profiles() {
  const nav = useNavigate();
  const [token, setToken] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    // DO NOT make this function async
    const t = getToken();
    if (!t) {
      nav("/login"); // navigate and stop
      return;
    }
    setToken(t);

    // do async work inside an IIFE (and ignore its return)
    (async () => {
      try {
        const list = await getProfiles(t);
        setProfiles(list);
      } catch (e: any) {
        setErr(String(e?.message ?? e));
      }
    })();
    // no return (no Promise!) from the effect
  }, [nav]);

  async function add() {
    if (!token || !name.trim()) return;
    try {
      const p = await createProfile(token, name.trim(), profiles.length === 0);
      setProfiles((prev) => [p, ...prev]);
      setName("");
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    }
  }

  return (
    <div className="wrap">
      <div className="row space">
        <h1>Choose a profile</h1>
        <button
          onClick={() => {
            clearToken();
            nav("/login");
          }}
        >
          Logout
        </button>
      </div>

      <div className="grid">
        {profiles.map((p) => (
          <Link key={p.id} to={`/profiles/${p.id}`} className="tile">
            <div className="avatar" />
            <div className="name">{p.name}</div>
          </Link>
        ))}
      </div>

      <div className="card">
        <input
          placeholder="New profile name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={add}>Add Profile</button>
      </div>

      {err && <p className="err">{err}</p>}
    </div>
  );
}
