import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DataProvider, useData } from "./contexts/DataContext";
import { LandingPage } from "./pages/LandingPage";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
} from "firebase/auth";
import DeAIDashboard from "./Dashboard";

const SignInModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: any) {
      // If no account exists yet, create one
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          onClose();
        } catch (createErr: any) {
          setError(createErr.message || "Failed to create account");
        }
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Incorrect password. Use 'Forgot password' to reset.");
      } else {
        setError(err.message || "Sign in failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(`Password reset email sent to ${email}`);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
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

        {mode === "forgot" ? (
          /* ── Forgot password ── */
          <form onSubmit={handleForgotPassword}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#dce8f0", letterSpacing: "-0.02em", marginBottom: "6px" }}>
              Reset password
            </div>
            <div style={{ fontSize: "14px", color: "#4a5f75", marginBottom: "24px", lineHeight: 1.5 }}>
              We'll send a reset link to your email.
            </div>

            {error && <div style={{ background: "rgba(255,45,85,0.1)", border: "1px solid rgba(255,45,85,0.25)", borderRadius: "8px", padding: "10px 14px", color: "#ff6b8a", fontSize: "13px", marginBottom: "14px" }}>{error}</div>}
            {message && <div style={{ background: "rgba(0,255,153,0.1)", border: "1px solid rgba(0,255,153,0.25)", borderRadius: "8px", padding: "10px 14px", color: "#00ff99", fontSize: "13px", marginBottom: "14px" }}>{message}</div>}

            <label style={{ display: "block", fontSize: "12px", color: "#8a9bb0", marginBottom: "8px" }}>Email address</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required placeholder="you@example.com"
              style={{ width: "100%", padding: "11px 14px", background: "#0d1117", border: "1px solid #1c2638", borderRadius: "8px", color: "#dce8f0", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "14px" }}
            />
            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px", border: "none", borderRadius: "8px", background: "#5b5ef4", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, marginBottom: "10px" }}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <button type="button" onClick={() => { setMode("signin"); setError(""); setMessage(""); }}
              style={{ width: "100%", padding: "11px", background: "transparent", border: "1px solid #1c2638", borderRadius: "8px", color: "#4a5f75", fontSize: "14px", cursor: "pointer" }}>
              Back to sign in
            </button>
          </form>
        ) : (
          /* ── Sign in ── */
          <form onSubmit={handleSignIn}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#dce8f0", letterSpacing: "-0.02em", marginBottom: "6px" }}>
              Sign in
            </div>
            <div style={{ fontSize: "14px", color: "#4a5f75", marginBottom: "24px", lineHeight: 1.5 }}>
              Enter your email and password.
            </div>

            {error && <div style={{ background: "rgba(255,45,85,0.1)", border: "1px solid rgba(255,45,85,0.25)", borderRadius: "8px", padding: "10px 14px", color: "#ff6b8a", fontSize: "13px", marginBottom: "14px" }}>{error}</div>}

            <label style={{ display: "block", fontSize: "12px", color: "#8a9bb0", marginBottom: "8px" }}>Email address</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required placeholder="you@example.com"
              style={{ width: "100%", padding: "11px 14px", background: "#0d1117", border: "1px solid #1c2638", borderRadius: "8px", color: "#dce8f0", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "14px" }}
            />

            <label style={{ display: "block", fontSize: "12px", color: "#8a9bb0", marginBottom: "8px" }}>Password</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required placeholder="••••••••"
              style={{ width: "100%", padding: "11px 14px", background: "#0d1117", border: "1px solid #1c2638", borderRadius: "8px", color: "#dce8f0", fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "6px" }}
            />

            <div style={{ textAlign: "right", marginBottom: "16px" }}>
              <button type="button" onClick={() => { setMode("forgot"); setError(""); }}
                style={{ background: "none", border: "none", color: "#5b5ef4", fontSize: "12px", cursor: "pointer", padding: 0 }}>
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px", border: "none", borderRadius: "8px", background: "#5b5ef4", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, marginBottom: "10px" }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <button type="button" onClick={onClose}
              style={{ width: "100%", padding: "11px", background: "transparent", border: "1px solid #1c2638", borderRadius: "8px", color: "#4a5f75", fontSize: "14px", cursor: "pointer" }}>
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

  // Handle any lingering email link sign-ins from before the switch
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = localStorage.getItem("emailForSignIn");
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            localStorage.removeItem("emailForSignIn");
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch(console.error);
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
