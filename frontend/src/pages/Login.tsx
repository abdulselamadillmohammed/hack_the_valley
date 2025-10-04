import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";
import { setToken } from "../auth";

export default function Login() {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const t = await login(u, p);
      setToken(t);
      nav("/profiles");
    } catch (e: any) {
      setErr(String(e.message || e));
    }
  }
  return (
    <div className="wrap">
      <h1>Login</h1>
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
        <button type="submit">Login</button>
      </form>
      <p>
        <Link to="/register">Create account</Link>
      </p>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
