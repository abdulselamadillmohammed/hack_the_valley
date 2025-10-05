// src/pages/App.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "./auth";

export default function App() {
  const nav = useNavigate();
  useEffect(() => {
    const t = getToken();
    nav(t ? "/profiles" : "/login");
  }, [nav]);
  return null;
}
