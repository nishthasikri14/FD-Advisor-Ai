import { useState, useEffect } from "react";
import API from "./api";

const TENURES = [1, 2, 3, 5, 7];
const SAFETY_COLORS = { AAA: "#1D9E75", "AA+": "#378ADD", AA: "#BA7517", "AA-": "#D4537E", "A+": "#888" };

export default function BankComparison() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenure, setSelectedTenure] = useState(1);
  const [amount, setAmount] = useState(100000);
  const [sortBy, setSortBy] = useState("rate");

  useEffect(() => {
    API.get("/banks")
      .then(({ data }) => setBanks(data))
      .catch(() => setBanks(FALLBACK_BANKS))
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...banks]
    .filter((b) => b.rates?.[selectedTenure])
    .sort((a, b) => {
      if (sortBy === "rate") return b.rates[selectedTenure] - a.rates[selectedTenure];
      if (sortBy === "safety") return a.safetyRating?.localeCompare(b.safetyRating);
      return a.name.localeCompare(b.name);
    });

  function calcReturn(rate) {
    return amount * Math.pow(1 + rate / 100, selectedTenure) - amount;
  }

  const best = sorted[0];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>🏦 Bank Rate Comparison</h1>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>
        Compare FD rates across top Indian banks and find the best return
      </p>

      {/* Filters */}
      <div style={cardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <label style={labelStyle}>Your amount (₹)</label>
            <input
              type="number" value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Tenure</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TENURES.map((t) => (
                <button key={t} onClick={() => setSelectedTenure(t)} style={{
                  padding: "8px 14px", fontSize: 13, fontWeight: 500,
                  border: "none", borderRadius: 8, cursor: "pointer",
                  background: selectedTenure === t ? "linear-gradient(135deg, #1D9E75, #378ADD)" : "#f3f4f6",
                  color: selectedTenure === t ? "#fff" : "#555"
                }}>{t}yr</button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Sort by</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={inputStyle}>
              <option value="rate">Highest rate</option>
              <option value="safety">Safety rating</option>
              <option value="name">Bank name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Best pick highlight */}
      {best && (
        <div style={{
          ...cardStyle,
          background: "linear-gradient(135deg, #1D9E75, #378ADD)",
          color: "#fff"
        }}>
          <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.8, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            ⭐ Best pick for {selectedTenure}yr tenure
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{best.name}</div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>Safety: {best.safetyRating} • Min deposit: ₹{best.minDeposit?.toLocaleString("en-IN")}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{best.rates[selectedTenure]}%</div>
              <div style={{ fontSize: 14, opacity: 0.85 }}>Returns ₹{Math.round(calcReturn(best.rates[selectedTenure])).toLocaleString("en-IN")} on ₹{amount.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      )}

      {/* Banks table */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
          All banks — {selectedTenure} year FD
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "#888" }}>Loading bank rates...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["#", "Bank", "Rate", "Returns", "Safety", "Min Deposit"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontWeight: 500, color: "#888", borderBottom: "1px solid #f0f0ee", fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((bank, i) => (
                  <tr key={bank._id || bank.shortName} style={{ background: i === 0 ? "#f0fdf8" : "transparent" }}>
                    <td style={tdStyle}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 500, color: "#111" }}>{bank.name}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{bank.shortName}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: i === 0 ? "#1D9E75" : "#111" }}>
                        {bank.rates[selectedTenure]}%
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500, color: "#1D9E75" }}>
                        +₹{Math.round(calcReturn(bank.rates[selectedTenure])).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11, padding: "3px 8px", borderRadius: 6, fontWeight: 600,
                        background: SAFETY_COLORS[bank.safetyRating] + "22",
                        color: SAFETY_COLORS[bank.safetyRating] || "#888"
                      }}>{bank.safetyRating}</span>
                    </td>
                    <td style={tdStyle}>₹{bank.minDeposit?.toLocaleString("en-IN") || "1,000"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Fallback if backend not seeded
const FALLBACK_BANKS = [
  { name: "ICICI Bank", shortName: "ICICI", rates: { 1: 7.2, 2: 7.25, 3: 7.3, 5: 7.1, 7: 7.1 }, safetyRating: "AAA", minDeposit: 10000 },
  { name: "HDFC Bank", shortName: "HDFC", rates: { 1: 7.1, 2: 7.2, 3: 7.25, 5: 7.0, 7: 7.0 }, safetyRating: "AAA", minDeposit: 5000 },
  { name: "SBI", shortName: "SBI", rates: { 1: 6.8, 2: 7.0, 3: 6.75, 5: 6.5, 7: 6.5 }, safetyRating: "AAA", minDeposit: 1000 },
  { name: "Axis Bank", shortName: "Axis", rates: { 1: 6.9, 2: 7.1, 3: 7.1, 5: 7.0, 7: 7.0 }, safetyRating: "AA+", minDeposit: 5000 },
  { name: "Kotak Mahindra", shortName: "Kotak", rates: { 1: 7.1, 2: 7.15, 3: 7.2, 5: 6.9, 7: 6.9 }, safetyRating: "AA+", minDeposit: 5000 },
  { name: "Yes Bank", shortName: "Yes", rates: { 1: 7.5, 2: 7.75, 3: 7.75, 5: 7.5, 7: 7.5 }, safetyRating: "AA-", minDeposit: 10000 },
  { name: "IndusInd Bank", shortName: "IndusInd", rates: { 1: 7.75, 2: 7.9, 3: 7.9, 5: 7.75, 7: 7.75 }, safetyRating: "AA", minDeposit: 10000 },
  { name: "PNB", shortName: "PNB", rates: { 1: 6.5, 2: 6.8, 3: 6.5, 5: 6.5, 7: 6.5 }, safetyRating: "AA+", minDeposit: 1000 },
];

const cardStyle = { background: "#fff", borderRadius: 16, padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" };
const labelStyle = { fontSize: 13, color: "#555", display: "block", marginBottom: 8, fontWeight: 500 };
const inputStyle = { width: "100%", padding: "10px 14px", fontSize: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: "#f9fafb", outline: "none" };
const tdStyle = { padding: "10px 12px", borderBottom: "0.5px solid #f0f0ee", color: "#333" };