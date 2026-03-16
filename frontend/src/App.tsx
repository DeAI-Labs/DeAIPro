import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DataProvider, useData } from "./contexts/DataContext";
import { LandingPage } from "./pages/LandingPage";
import { auth } from "./firebase";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import DeAIDashboard from "./DeAIDashboard";

// ── Modal rendered via portal so LandingPage stacking context can't trap it ──
const SignInModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.href,
        handleCodeInApp: true,
      });
      localStorage.setItem("emailForSignIn", email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send sign-in link");
    } finally {
      setLoading(false);
    }
  };

  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.78)",
    backdropFilter: "blur(6px)",
  };
  const box: React.CSSProperties = {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: "16px",
    padding: "36px",
    width: "100%",
    maxWidth: "440px",
    boxShadow: "0 32px 64px rgba(0,0,0,0.7)",
    fontFamily: "system-ui, sans-serif",
  };
  const input: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    background: "#1e293b", border: "1px solid #334155",
    borderRadius: "8px", color: "#f1f5f9",
    fontSize: "14px", outline: "none",
    marginBottom: "14px", boxSizing: "border-box",
  };
  const btnPrimary: React.CSSProperties = {
    width: "100%", padding: "13px",
    borderRadius: "8px", background: "#3b82f6",
    color: "#fff", fontWeight: 600, fontSize: "14px",
    border: "none", cursor: "pointer",
    marginBottom: "8px", opacity: loading ? 0.6 : 1,
  };
  const btnGhost: React.CSSProperties = {
    width: "100%", padding: "9px",
    background: "none", border: "none",
    color: "#64748b", cursor: "pointer", fontSize: "13px",
  };

  return createPortal(
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={box}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
            DeAI Strategies
          </div>
          <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Bittensor Intelligence Analytics
          </div>
        </div>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "44px", marginBottom: "16px" }}>📬</div>
            <div style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", marginBottom: "10px" }}>
              Check your email
            </div>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "24px" }}>
              Sign-in link sent to <strong style={{ color: "#f1f5f9" }}>{email}</strong>
            </p>
            <button onClick={onClose} style={btnGhost}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9", marginBottom: "6px" }}>
              Request Access
            </div>
            <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "20px" }}>
              Enter your authorized email — no password needed.
            </div>

            {error && (
              <div style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: "8px", padding: "10px 14px", color: "#fca5a5", fontSize: "12px", marginBottom: "14px" }}>
                {error}
              </div>
            )}

            <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={input}
            />

            <button type="submit" disabled={loading} style={btnPrimary}>
              {loading ? "Sending…" : "Send Sign-In Link →"}
            </button>
            <button type="button" onClick={onClose} style={btnGhost}>
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

// ── Main app content ────────────────────────────────────────────────────────
const AppContent: React.FC = () => {
  const { state } = useData();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Handle email link sign-in return
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = localStorage.getItem("emailForSignIn");
      if (!email) email = window.prompt("Please confirm your email to complete sign-in:");
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            localStorage.removeItem("emailForSignIn");
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            console.error("Sign-in link error:", err);
            alert("Sign-in failed: " + err.message);
          });
      }
    }
  }, []);

  // Wait for Firebase to restore auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => setAuthChecked(true));
    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#040508" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #1e3a5f", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Authenticated → full dashboard
  if (state.user) return <DeAIDashboard />;

  // Not authenticated → landing + modal
  return (
    <>
      {isSignInOpen && <SignInModal onClose={() => setIsSignInOpen(false)} />}
      <LandingPage onSignIn={() => setIsSignInOpen(true)} />
    </>
  );
};

const App: React.FC = () => (
  <DataProvider>
    <AppContent />
  </DataProvider>
);

export default App;
