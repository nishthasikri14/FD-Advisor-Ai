import { useState } from "react";
import API from "./api";

export default function AuthPage({ onLogin, onBack }) {
  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email || !password) return setError("Please fill all fields");
    if (mode === "register" && !name) return setError("Please enter your name");

    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/user/login" : "/user/register";
      const payload = mode === "login" ? { email, password } : { name, email, password };
      const { data } = await API.post(endpoint, payload);
      onLogin(data);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "calc(100vh - 60px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f8fafc", padding: "2rem"
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: "2.5rem",
        width: "100%", maxWidth: 420,
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 1rem",
            background: "linear-gradient(135deg, #1D9E75, #378ADD)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24
          }}>🏦</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: "#111" }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ fontSize: 14, color: "#888" }}>
            {mode === "login" ? "Login to save your FD strategies" : "Join to start planning your FDs"}
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: "flex", background: "#f3f4f6", borderRadius: 10,
          padding: 4, marginBottom: "1.5rem"
        }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
              flex: 1, padding: "8px", fontSize: 13, fontWeight: 500,
              border: "none", borderRadius: 8, cursor: "pointer",
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#111" : "#888",
              boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              transition: "all 0.2s", textTransform: "capitalize"
            }}>{m}</button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                type="text" placeholder="Nishtha Sikri"
                value={name} onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: 12, padding: "10px 14px", borderRadius: 8,
            background: "#FEF2F2", color: "#DC2626", fontSize: 13
          }}>{error}</div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={loading} style={{
          width: "100%", marginTop: 20, padding: "12px",
          fontSize: 15, fontWeight: 600, border: "none", borderRadius: 10,
          background: "linear-gradient(135deg, #1D9E75, #378ADD)",
          color: "#fff", cursor: "pointer", opacity: loading ? 0.7 : 1
        }}>
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
        </button>

        {/* Back */}
        <button onClick={onBack} style={{
          width: "100%", marginTop: 10, padding: "10px",
          fontSize: 13, border: "none", background: "transparent",
          color: "#888", cursor: "pointer"
        }}>← Back to app</button>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 13, color: "#555", display: "block", marginBottom: 6, fontWeight: 500 };
const inputStyle = {
  width: "100%", padding: "10px 14px", fontSize: 14,
  border: "1px solid #e5e7eb", borderRadius: 10,
  background: "#f9fafb", outline: "none", boxSizing: "border-box"
};