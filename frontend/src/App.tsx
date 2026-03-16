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
import DeAIDashboard from "./Dashboard";

// Colours match the LandingPage dark palette: #040508 bg, #090c12 card, #1c2638 border, #5b5ef4 accent
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

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: "rgba(4,5,8,0.82)",
        backdropFilter: "blur(6px)",
        padding: "20px",
      }}
    >
      <div style={{
        background: "#090c12",
        border: "1px solid #1c2638",
        borderRadius: "12px",
        padding: "36px",
        width: "100%",
        maxWidth: "380px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>

        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "38px", marginBottom: "14px" }}>📬</div>
            <div style={{ fontSize: "17px", fontWeight: 700, color: "#dce8f0", marginBottom: "8px" }}>
              Check your email
            </div>
            <div style={{ fontSize: "13px", color: "#4a5f75", lineHeight: 1.6, marginBottom: "24px" }}>
              We sent a sign-in link to{" "}
              <span style={{ color: "#8a9bb0" }}>{email}</span>
            </div>
            <button
              onClick={onClose}
              style={{ width: "100%", padding: "11px", background: "transparent", border: "1px solid #1c2638", borderRadius: "8px", color: "#4a5f75", fontSize: "14px", cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#dce8f0", letterSpacing: "-0.02em", marginBottom: "6px" }}>
              Sign in
            </div>
            <div style={{ fontSize: "14px", color: "#4a5f75", marginBottom: "24px", lineHeight: 1.5 }}>
              Enter your email and we'll send you a magic link.
            </div>

            {error && (
              <div style={{ background: "rgba(255,45,85,0.1)", border: "1px solid rgba(255,45,85,0.25)", borderRadius: "8px", padding: "10px 14px", color: "#ff6b8a", fontSize: "13px", marginBottom: "14px" }}>
                {error}
              </div>
            )}

            <label style={{ display: "block", fontSize: "12px", color: "#8a9bb0", marginBottom: "8px" }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: "100%", padding: "11px 14px",
                background: "#0d1117", border: "1px solid #1c2638",
                borderRadius: "8px", color: "#dce8f0",
                fontSize: "14px", outline: "none",
                boxSizing: "border-box", marginBottom: "14px",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "12px", border: "none",
                borderRadius: "8px", background: "#5b5ef4",
                color: "#fff", fontSize: "14px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                marginBottom: "10px",
              }}
            >
              {loading ? "Sending…" : "Send sign-in link"}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%", padding: "11px",
                background: "transparent", border: "1px solid #1c2638",
                borderRadius: "8px", color: "#4a5f75",
                fontSize: "14px", cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

const AppContent: React.FC = () => {
  const { state } = useData();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => setAuthChecked(true));
    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#040508" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #1c2638", borderTopColor: "#5b5ef4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (state.user) return <DeAIDashboard />;

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
