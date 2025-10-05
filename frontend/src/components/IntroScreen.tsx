import { useEffect, useState } from "react";

interface IntroScreenProps {
  onComplete: () => void;
}

export default function IntroScreen({ onComplete }: IntroScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500); // Wait for fade out animation
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`intro-screen ${fadeOut ? "fade-out" : ""}`}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        transition: "opacity 0.5s ease-out",
        opacity: fadeOut ? 0 : 1,
      }}
    >
      <div
        style={{
          textAlign: "center",
          animation: "scaleIn 1s ease-out",
        }}
      >
        <h1
          style={{
            fontSize: "4rem",
            fontWeight: 900,
            color: "#e50914",
            letterSpacing: "-2px",
            textTransform: "uppercase",
            textShadow: "0 4px 8px rgba(229, 9, 20, 0.6)",
            marginBottom: "1rem",
          }}
        >
          ReminAI
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            color: "#ffffff",
            opacity: 0.8,
            fontWeight: 300,
          }}
        >
          Capture. Remember. Relive.
        </p>
      </div>
    </div>
  );
}
