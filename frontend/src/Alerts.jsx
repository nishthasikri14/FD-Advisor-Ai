import { useEffect, useState } from "react";

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: "1.5rem",
  marginBottom: "1rem",
  boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  fontSize: 14,
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  background: "#f9fafb",
  outline: "none",
};

const labelStyle = {
  fontSize: 13,
  color: "#888",
  display: "block",
  marginBottom: 6,
};

function Alerts({ user }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    amount: "",
    bank: "SBI",
    maturityDate: "",
    email: user?.email || "",
  });
  const [saveMsg, setSaveMsg] = useState("");

  const token = localStorage.getItem("token");

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/alerts", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const data = await res.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Could not load alerts. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const addAlert = async () => {
    if (!form.amount || !form.maturityDate || !form.email) {
      setSaveMsg("Please fill all fields.");
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSaveMsg("Alert added successfully!");
      setForm({ amount: "", bank: "SBI", maturityDate: "", email: user?.email || "" });
      fetchAlerts();
    } catch {
      setSaveMsg("Failed to add alert.");
    }
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const deleteAlert = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/alerts/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      fetchAlerts();
    } catch {
      setError("Failed to delete alert.");
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const daysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getUrgency = (days) => {
    if (days <= 7) return { color: "#D4537E", bg: "#FBEAF0", label: "Due soon!" };
    if (days <= 30) return { color: "#BA7517", bg: "#FAEEDA", label: "This month" };
    return { color: "#1D9E75", bg: "#E1F5EE", label: "Upcoming" };
  };

  return (
    <div style={{
      fontFamily: "DM Sans, sans-serif",
      maxWidth: 900,
      margin: "0 auto",
      padding: "2rem 1rem",
      background: "#f8fafc",
      minHeight: "100vh",
    }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>🔔 FD Maturity Alerts</h1>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>
        Track your FD maturity dates and get notified before they mature
      </p>

      {/* Add Alert Form */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
          Add New Alert
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 100000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Bank</label>
            <select value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} style={inputStyle}>
              {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "Yes Bank", "IndusInd", "PNB"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Maturity Date</label>
            <input
              type="date"
              value={form.maturityDate}
              onChange={(e) => setForm({ ...form, maturityDate: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Email for notification</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={addAlert}
            style={{
              padding: "12px 22px", fontSize: 14, fontWeight: 600,
              border: "none", borderRadius: "10px",
              background: "linear-gradient(135deg, #1D9E75, #378ADD)",
              color: "#fff", cursor: "pointer",
            }}
          >
            Add Alert
          </button>
          {saveMsg && (
            <span style={{ fontSize: 13, color: saveMsg.includes("success") ? "#1D9E75" : "#D85A30" }}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" }}>
          Your Alerts ({alerts.length})
        </div>

        {loading && <p style={{ color: "#888", fontSize: 14 }}>Loading...</p>}
        {error && <p style={{ color: "#D85A30", fontSize: 14 }}>⚠️ {error}</p>}

        {!loading && !error && alerts.length === 0 && (
          <p style={{ color: "#aaa", fontSize: 14 }}>No alerts yet. Add your first FD alert above!</p>
        )}

        {alerts.map((a) => {
          const days = daysUntil(a.maturityDate);
          const urgency = getUrgency(days);
          return (
            <div key={a._id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 16px", borderRadius: 10,
              border: "0.5px solid #e5e5e5", marginBottom: 8,
              background: "#fafafa",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  padding: "4px 10px", borderRadius: 8,
                  background: urgency.bg, color: urgency.color,
                  fontSize: 11, fontWeight: 600,
                }}>
                  {days > 0 ? `${days} days` : "Matured"} · {urgency.label}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    ₹{Number(a.amount).toLocaleString("en-IN")} — {a.bank}
                  </div>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    Matures: {new Date(a.maturityDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    &nbsp;· {a.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteAlert(a._id)}
                style={{
                  padding: "6px 12px", fontSize: 12, border: "1px solid #e5e7eb",
                  borderRadius: 8, background: "#fff", color: "#D4537E",
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Alerts;