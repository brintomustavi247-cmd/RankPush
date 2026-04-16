"use client";

/**
 * Full-screen loading spinner shown while Firebase Auth re-initializes on page reload.
 * Used in dashboard, timer, and arena to prevent rendering protected UI with null user.
 */
export function AuthLoadingSpinner() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#02010a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid rgba(14,165,233,0.2)",
            borderTop: "3px solid #0ea5e9",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: 11,
            letterSpacing: "0.3em",
            color: "rgba(14,165,233,0.7)",
            textTransform: "uppercase",
          }}
        >
          Initializing System…
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
