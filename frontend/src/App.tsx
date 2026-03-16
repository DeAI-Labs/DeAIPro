import React, { useState, useEffect } from "react";
import { DataProvider, useData } from "./contexts/DataContext";
import { DashboardPage } from "./pages/DashboardPage";
import { NewsPage, ResearchPage, LessonsPage } from "./pages/ContentPages";
import { LandingPage } from "./pages/LandingPage";
import { Header, Sidebar, Footer, Container } from "./components/layout/Layout";
import { Button } from "./components/ui/Button";
import { auth } from "./firebase";
import {
  signOut,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from "firebase/auth";

type PageType =
  | "dashboard"
  | "news"
  | "research"
  | "lessons"
  | "portfolio"
  | "settings";

// ============ Sign In Modal ============

const SignInModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      localStorage.setItem("emailForSignIn", email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send sign-in link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl font-bold text-white mb-1">DeAI Strategies</div>
          <div className="text-gray-400 text-sm">Bittensor Intelligence Analytics</div>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-4xl">📬</div>
            <h2 className="text-xl font-bold text-white">Check your email</h2>
            <p className="text-gray-400 text-sm">
              We sent a sign-in link to <strong className="text-white">{email}</strong>.
              Click the link to access your account.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                Access DeAI Strategies
              </h2>
              <p className="text-gray-400 text-sm">
                Enter your authorized email to receive a secure sign-in link. No
                password required.
              </p>
            </div>

            {error && (
              <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition"
            >
              {loading ? "Sending..." : "Send Sign-In Link →"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ============ App Layout ============

const AppLayout: React.FC<{
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
}> = ({ currentPage, onPageChange }) => {
  const { state } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarItems = [
    { icon: "📊", label: "Dashboard", href: "dashboard" },
    { icon: "📰", label: "News Feed", href: "news" },
    { icon: "🔬", label: "Research", href: "research" },
    { icon: "📚", label: "Education", href: "lessons" },
    { icon: "💼", label: "Portfolio", href: "portfolio" },
    { icon: "⚙️", label: "Settings", href: "settings" },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <DashboardPage />;
      case "news": return <NewsPage />;
      case "research": return <ResearchPage />;
      case "lessons": return <LessonsPage />;
      case "portfolio": return <PortfolioPage />;
      case "settings": return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        items={sidebarItems}
        activeLocation={currentPage}
        onItemClick={(href) => {
          onPageChange(href as PageType);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="DeAIPro"
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          actions={
            state.user ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => signOut(auth)}
              >
                Sign Out
              </Button>
            ) : null
          }
        />
        <main className="flex-1 overflow-y-auto bg-gray-50">{renderPage()}</main>
        <Footer />
      </div>
    </div>
  );
};

// ============ Portfolio Page ============

const PortfolioPage: React.FC = () => {
  const { state } = useData();
  return (
    <>
      <Header title="Portfolio" subtitle="Your subnet holdings" />
      <Container>
        {state.portfolio.items.length > 0 ? (
          <div className="space-y-4">
            {state.portfolio.items.map((item) => {
              const subnet = state.subnets.find((s) => s.id === item.subnetId);
              return (
                <div key={item.subnetId} className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{subnet?.n || "Unknown"}</h3>
                      <p className="text-sm text-gray-600">
                        {item.amount} units @ ${item.purchasePrice}
                      </p>
                    </div>
                    <p className="font-bold">
                      ${(item.amount * item.purchasePrice).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div className="bg-white p-4 rounded-lg border-2 border-blue-600 font-bold">
              <div className="flex items-center justify-between">
                <span>Total Value:</span>
                <span>${state.portfolio.totalValue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No portfolio items yet</p>
          </div>
        )}
      </Container>
    </>
  );
};

// ============ Settings Page ============

const SettingsPage: React.FC = () => {
  const [theme, setTheme] = React.useState("light");
  const [notifications, setNotifications] = React.useState(true);

  return (
    <>
      <Header title="Settings" subtitle="Customize your experience" />
      <Container>
        <div className="bg-white p-6 rounded-lg border max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Enable notifications</span>
            </label>
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Save Settings
          </button>
        </div>
      </Container>
    </>
  );
};

// ============ App Content ============

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { state } = useData();

  // Handle email link sign-in when user returns from email
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = localStorage.getItem("emailForSignIn");

      if (!email) {
        // Ask the user for their email if not saved
        email = window.prompt("Please confirm your email to complete sign-in:");
      }

      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            localStorage.removeItem("emailForSignIn");
            // Clean up the URL
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((err) => {
            console.error("Sign-in link error:", err);
            alert("Sign-in failed: " + err.message);
          });
      }
    }
  }, []);

  // Wait for Firebase to restore auth state before rendering
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // Show spinner while Firebase checks auth state
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not logged in — show landing page
  if (!state.user) {
    return (
      <>
        {isSignInOpen && (
          <SignInModal onClose={() => setIsSignInOpen(false)} />
        )}
        <LandingPage onSignIn={() => setIsSignInOpen(true)} />
      </>
    );
  }

  // Logged in — show dashboard
  return (
    <AppLayout
      currentPage={currentPage}
      onPageChange={setCurrentPage}
    />
  );
};

// ============ Root App ============

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-4xl font-bold text-white mb-4">DeAIPro</div>
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;
