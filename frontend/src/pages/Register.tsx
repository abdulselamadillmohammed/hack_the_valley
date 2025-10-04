import { useState } from "react";
import { register } from "../api";
import { Link } from "react-router-dom";

export default function Register() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [msg, setMsg] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await register(u, p);
      setMsg("Registered. Go to login.");
    } catch (e: any) {
      setMsg(String(e.message || e));
    }
  }
  return (
    <div className="wrap">
      <h1>Register</h1>
      <form onSubmit={submit} className="card">
        <input
          placeholder="username"
          value={u}
          onChange={(e) => setU(e.target.value)}
        />
        <input
          placeholder="password"
          type="password"
          value={p}
          onChange={(e) => setP(e.target.value)}
        />
        <button type="submit">Create account</button>
      </form>
      <p>
        <Link to="/login">Back to login</Link>
      </p>
      {msg && <p>{msg}</p>}
    </div>
  );
}
