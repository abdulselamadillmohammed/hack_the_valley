import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profiles from "./pages/Profiles";
import Journal from "./pages/Journal";
import IntroScreen from "./components/IntroScreen";
import { useState, useEffect } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    // Show intro only on first visit or when no token exists
    const hasSeenIntro = sessionStorage.getItem("hasSeenIntro");
    const token = getToken();

    if (!hasSeenIntro && !token) {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    sessionStorage.setItem("hasSeenIntro", "true");
  };

  if (showIntro) {
    return <IntroScreen onComplete={handleIntroComplete} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/profiles"
          element={
            <ProtectedRoute>
              <Profiles />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <Journal />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/profiles" />} />
      </Routes>
    </BrowserRouter>
  );
}
