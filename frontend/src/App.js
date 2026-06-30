import { useState, useEffect } from "react";
import FDLadderBuilder from "./FDLadderBuilder";
import AuthPage from "./AuthPage";
import BankComparison from "./BankComparison";
import AIAdvisor from "./AIAdvisor";
import "./App.css";
import Alerts from "./Alerts";

export default function App() {
  const [page, setPage] = useState("ladder");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  function handleLogin(userData) {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userData.token);
    setPage("ladder");
  }

  function handleLogout() {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setPage("ladder");
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Navbar */}
      <nav style={{
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #1D9E75, #378ADD)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 14
          }}>FD</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>FD Advisor</span>
        </div>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { id: "ladder", label: "🪜 Ladder Builder" },
            { id: "banks", label: "🏦 Bank Rates" },
            { id: "ai", label: "🤖 AI Advisor" },
            { id: "alerts", label: "🔔 Alerts" },
          ].map((item) => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              padding: "6px 14px", fontSize: 13, fontWeight: 500,
              border: "none", borderRadius: 8, cursor: "pointer",
              background: page === item.id ? "linear-gradient(135deg, #1D9E75, #378ADD)" : "transparent",
              color: page === item.id ? "#fff" : "#555",
              transition: "all 0.2s"
            }}>{item.label}</button>
          ))}
        </div>

        {/* Auth */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: "#555" }}>👋 {user.name}</span>
              <button onClick={handleLogout} style={{
                padding: "6px 14px", fontSize: 13, border: "1px solid #e5e7eb",
                borderRadius: 8, background: "#fff", cursor: "pointer", color: "#555"
              }}>Logout</button>
            </>
          ) : (
            <button onClick={() => setPage("auth")} style={{
              padding: "6px 16px", fontSize: 13, fontWeight: 600,
              border: "none", borderRadius: 8, cursor: "pointer",
              background: "linear-gradient(135deg, #1D9E75, #378ADD)", color: "#fff"
            }}>Login / Register</button>
          )}
        </div>
      </nav>

      {/* Pages */}
      {page === "ladder" && <FDLadderBuilder user={user} />}
      {page === "banks" && <BankComparison />}
      {page === "ai" && <AIAdvisor user={user} />}
      {page === "auth" && <AuthPage onLogin={handleLogin} onBack={() => setPage("ladder")} />}
      {page === "alerts" && <Alerts />} 
    </div>
  );
}