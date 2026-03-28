import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { DataProvider, useData } from "./contexts/DataContext";

import { auth } from "./firebase";


import Dashboard from "./Dashboard";

const AppContent: React.FC = () => {
  const { state } = useData();
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const onReconnect = () => setReconnecting(true);
    const onReconnected = () => setReconnecting(false);
    document.addEventListener('backend-reconnecting', onReconnect);
    document.addEventListener('backend-reconnected', onReconnected);
    return () => {
      document.removeEventListener('backend-reconnecting', onReconnect);
      document.removeEventListener('backend-reconnected', onReconnected);
    };
  }, []);

  return (
    <>
      {reconnecting && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, background: "#ff9000", color: "#fff", textAlign: "center", padding: "4px", zIndex: 9999, fontSize: "12px", fontWeight: "bold" }}>
          Backend connection dropped. Reconnecting...
        </div>
      )}
      <Dashboard />
    </>
  );
};

const App: React.FC = () => (
  <DataProvider>
    <AppContent />
  </DataProvider>
);

export default App;
