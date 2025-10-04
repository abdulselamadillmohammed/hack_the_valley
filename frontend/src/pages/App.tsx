import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../auth";

export default function App() {
  const nav = useNavigate();
  useEffect(() => {
    getToken() ? nav("/profiles") : nav("/login");
  }, []);
  return null;
}
