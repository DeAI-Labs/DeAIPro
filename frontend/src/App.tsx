import React, { useState, useEffect } from "react";
import { DataProvider, useData } from "./contexts/DataContext";
import { LandingPage } from "./pages/LandingPage";
import { auth } from "./firebase";
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";
import DeAIDashboard from "./DeAIDashboard";

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
      await sendSignInLinkToEmail(auth, email, { url: window.location.href, handleCodeInApp: true });
      localStorage.setItem("emailForSignIn", email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send sign-in link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-white mb-1">DeAI Strategies</div>
          <div className="text-gray-400 text-sm">Bittensor Intelligence Analytics</div>
        </div>
        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">📬</div>
            <h2 className="text-xl font-bold text-white">Check your email</h2>
            <p className="text-gray-400 text-sm">We sent a sign-in link to <strong className="text-white">{email}</strong>.</p>
            <button onClick={onClose} className="w-full py-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Request Access</h2>
              <p className="text-gray-400 text-sm">Enter your authorized email to receive a secure sign-in link.</p>
            </div>
            {error && <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition">{loading ? "Sending…" : "Send Sign-In Link →"}</button>
            <button type="button" onClick={onClose} className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition">Cancel</button>
          </form>
        )}
      </div>
    </div>
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
          .then(() => { localStorage.removeItem("emailForSignIn"); window.history.replaceState({}, document.title, window.location.pathname); })
          .catch((err) => { console.error("Sign-in link error:", err); alert("Sign-in failed: " + err.message); });
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => setAuthChecked(true));
    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return <div className="flex items-center justify-center h-screen bg-gray-900"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
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
