import { useState, useRef, useEffect } from "react";
import API from "./api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const RATES = { 1: 6.8, 2: 7.2, 3: 7.4, 5: 7.6, 7: 7.8 };
const RUNG_COLORS = ["#1D9E75", "#378ADD", "#BA7517", "#D4537E", "#7F77DD"];
const RUNG_BG = ["#E1F5EE", "#E6F1FB", "#FAEEDA", "#FBEAF0", "#EEEDFE"];

const QUICK_QUESTIONS = [
  "Why is ladder better for me?",
  "How much tax am I saving?",
  "Which rung has the best rate?",
  "What if rates drop 0.5%?",
  "How liquid is my plan?",
];

function fmt(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

// ── AI Call (routes through your Express backend) ──────────────────────────
async function callAI(userMessage, userProfile, strategy, comparison) {
  const token = localStorage.getItem("token");

  // Build grounded context — AI will only answer from this data
  const contextBlock = JSON.stringify({ userProfile, strategy, comparison }, null, 2);

  const systemPrompt = `You are a precise Indian FD (Fixed Deposit) advisor. Answer ONLY based on the structured data below. Never give generic advice. Always cite specific rupee amounts, rates, and bank names from the data.

=== USER CONTEXT ===
${contextBlock}

Rules:
1. Reference actual numbers from the data above.
2. Always compare ladder vs single FD using the exact figures given.
3. Start your response with "Confidence: High", "Confidence: Medium", or "Confidence: Low" on the first line, then "Risk: <one line>" on the second line. Then a blank line, then your answer.
4. Highlight ₹ difference, liquidity benefit, or tax benefit where relevant.
5. Keep answer under 180 words. Use ₹ symbol. Be decisive and specific.`;

  try {
    const res = await fetch("http://localhost:5000/api/ai/advisor", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message: userMessage, systemPrompt }),
    });

    if (!res.ok) throw new Error("AI endpoint failed");
    const data = await res.json();
    const text = data.reply || data.text || "No response from advisor.";

    // Parse confidence & risk from first two lines
    const lines = text.split("\n");
    const confLine = lines.find((l) => l.toLowerCase().startsWith("confidence:")) || "";
    const riskLine = lines.find((l) => l.toLowerCase().startsWith("risk:")) || "";
    const confWord = confLine.split(":")[1]?.trim() || "High";
    const confidence = ["High", "Medium", "Low"].find(
      (c) => c.toLowerCase() === confWord.toLowerCase()
    ) || "High";
    const riskNote = riskLine.split(":").slice(1).join(":").trim() || "Returns depend on interest rate stability.";
    // Remove first two lines from displayed text
    const cleanText = lines
      .filter((l) => !l.toLowerCase().startsWith("confidence:") && !l.toLowerCase().startsWith("risk:"))
      .join("\n")
      .trim();

    return { text: cleanText, confidence, riskNote };
  } catch {
    // Fallback if backend not connected
    return {
      text: `Based on your data: Your ₹${(userProfile.amount / 100000).toFixed(1)}L ladder nets ${fmt(strategy.totalNet)} — that's ${fmt(strategy.totalNet - comparison.singleFDNet)} more than a single FD. Your ${userProfile.taxBracket}% tax bracket makes spreading maturities especially beneficial.`,
      confidence: "High",
      riskNote: "Returns depend on interest rate stability.",
    };
  }
}

export default function FDLadderBuilder() {
  const [amount, setAmount] = useState(500000);
  const [taxBracket, setTaxBracket] = useState(30);
  const [liquidity, setLiquidity] = useState("yearly");
  const [duration, setDuration] = useState(5);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // AI Chat state
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function buildLadder() {
    setLoading(true);
    setSaveMsg("");
    setShowChat(false);
    setMessages([]);
    try {
      const { data } = await API.post("/ladder/calculate", {
        amount, taxBracket, liquidity, duration,
      });
      const coloredRungs = data.rungs.map((r, i) => ({
        ...r,
        color: RUNG_COLORS[i % 5],
        bg: RUNG_BG[i % 5],
      }));
      const singleRate = RATES[parseInt(duration)] || 7.6;
      setResults({
        ...data,
        rungs: coloredRungs,
        singleRate,
        dur: parseInt(duration),
        tax: taxBracket / 100,
      });
    } catch {
      alert("Could not reach server. Make sure backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  }

  async function saveStrategy() {
    const token = localStorage.getItem("token");
    if (!token) { setSaveMsg("Please log in to save strategies."); return; }
    try {
      const res = await fetch("http://localhost:5000/api/ladder/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, taxBracket, liquidity, duration }),
      });
      if (!res.ok) throw new Error();
      setSaveMsg("Strategy saved successfully!");
    } catch {
      setSaveMsg("Failed to save. Please try again.");
    }
  }

  function openChat() {
    setShowChat(true);
    if (messages.length === 0 && results) {
      const gain = results.totalNet - results.singleFDNet;
      setMessages([{
        role: "assistant",
        text: `Namaste! I can see your ₹${(amount / 100000).toFixed(1)}L ladder across ${results.rungs.length} rungs, netting ${fmt(results.totalNet)} — that's ${fmt(gain)} more than a single ${results.dur}yr FD.\n\nAsk me anything specific about your plan!`,
        confidence: "High",
        riskNote: "Returns assume stable interest rate environment.",
      }]);
    }
  }

  async function sendMessage(text) {
    const msg = text || chatInput.trim();
    if (!msg || aiLoading || !results) return;
    setChatInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setAiLoading(true);

    const userProfile = { amount, taxBracket, liquidity, duration };
    const strategy = {
      totalNet: results.totalNet,
      totalMaturity: results.totalMaturity,
      totalTax: results.totalTax,
      rungs: results.rungs.map((r) => ({
        tenure: r.tenure, rate: r.rate,
        principal: r.principal, maturity: r.maturity,
        netReturn: r.netReturn, taxAmt: r.taxAmt,
      })),
    };
    const comparison = {
      singleFDNet: results.singleFDNet,
      singleFDRate: results.singleRate,
      singleFDTenure: results.dur,
    };

    const { text: aiText, confidence, riskNote } = await callAI(msg, userProfile, strategy, comparison);
    setMessages((m) => [...m, { role: "assistant", text: aiText, confidence, riskNote }]);
    setAiLoading(false);
  }

  const gain = results ? results.totalNet - results.singleFDNet : 0;

  return (
    <div style={{
      fontFamily: "DM Sans, sans-serif",
      maxWidth: 900,
      margin: "0 auto",
      padding: "2rem 1rem",
      background: "#f8fafc",
      minHeight: "100vh",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dot { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
        button:disabled { opacity:.6; cursor:not-allowed; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#e5e7eb; border-radius:4px; }
      `}</style>

      {/* Header */}
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>FD Ladder Builder</h1>
      <p style={{ fontSize: 14, color: "#888", marginBottom: 24 }}>
        Build a personalized Fixed Deposit laddering strategy to maximize returns & liquidity
      </p>

      {/* Input Section */}
      <div style={cardStyle}>
        <div style={sectionTitle}>Your profile</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Total amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Tax bracket</label>
            <select value={taxBracket} onChange={(e) => setTaxBracket(parseInt(e.target.value))} style={inputStyle}>
              <option value={0}>0% (No tax)</option>
              <option value={5}>5%</option>
              <option value={10}>10%</option>
              <option value={20}>20%</option>
              <option value={30}>30%</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Liquidity preference</label>
            <select value={liquidity} onChange={(e) => setLiquidity(e.target.value)} style={inputStyle}>
              <option value="yearly">Access money every year</option>
              <option value="every2">Access every 2 years</option>
              <option value="flexible">Flexible (maximize returns)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ladder duration</label>
            <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} style={inputStyle}>
              <option value={3}>3 years</option>
              <option value={5}>5 years</option>
              <option value={7}>7 years</option>
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={buildLadder} style={primaryBtn} disabled={loading}>
            {loading ? "Calculating..." : "Build ladder"}
          </button>
          {results && (
            <>
              <button onClick={saveStrategy} style={secondaryBtn}>Save strategy</button>
              <button onClick={openChat} style={{
                ...secondaryBtn,
                background: showChat ? "#E1F5EE" : "#fff",
                borderColor: "#1D9E75",
                color: "#1D9E75",
                fontWeight: 600,
              }}>
                🤖 Ask AI Advisor
              </button>
            </>
          )}
          {saveMsg && (
            <span style={{ fontSize: 13, color: saveMsg.includes("success") ? "#1D9E75" : "#D85A30" }}>
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      {results && (
        <>
          {/* ── STEP 3: Why Ladder Is Better ───────────────────────────────── */}
          <div style={{
            ...cardStyle,
            border: "1.5px solid #1D9E75",
            background: "linear-gradient(135deg, #f0fdf8 0%, #f8fafc 100%)",
          }}>
            <div style={sectionTitle}>✅ Why your ladder plan wins</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
              {/* Rupee difference */}
              <WhyCard
                icon="₹"
                color="#1D9E75"
                bg="#E1F5EE"
                label="Rupee advantage"
                value={`${gain >= 0 ? "+" : ""}${fmt(gain)}`}
                desc={`vs single ${results.dur}yr FD @ ${results.singleRate}%`}
              />
              {/* Liquidity */}
              <WhyCard
                icon="💧"
                color="#378ADD"
                bg="#E6F1FB"
                label="Liquidity benefit"
                value="Annual access"
                desc="1 FD matures every year — reinvest or withdraw freely"
              />
              {/* Tax */}
              <WhyCard
                icon="🏛️"
                color="#BA7517"
                bg="#FAEEDA"
                label="Tax efficiency"
                value="Spread TDS"
                desc={`At ${taxBracket}% bracket, split maturities reduce single-year TDS hit`}
              />
              {/* Rate diversification */}
              <WhyCard
                icon="📊"
                color="#7F77DD"
                bg="#EEEDFE"
                label="Rate diversification"
                value={`${Math.min(...results.rungs.map((r) => r.rate))}%→${Math.max(...results.rungs.map((r) => r.rate))}%`}
                desc="Captures rising rate curve instead of locking one rate"
              />
            </div>
          </div>

          {/* ── AI ADVISOR CHAT ─────────────────────────────────────────────── */}
          {showChat && (
            <div style={{ ...cardStyle, border: "1.5px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={sectionTitle}>🤖 AI Advisor</div>
                {/* Context badge — grounded indicator */}
                <div style={{
                  display: "flex", flexWrap: "wrap", gap: 5,
                }}>
                  {[
                    `₹${(amount / 100000).toFixed(1)}L`,
                    `${taxBracket}% tax`,
                    liquidity,
                    `${results.rungs.length} rungs`,
                  ].map((tag) => (
                    <span key={tag} style={{
                      fontSize: 10, padding: "2px 7px", borderRadius: 10,
                      background: "#E1F5EE", color: "#1D9E75", fontWeight: 500,
                    }}>{tag}</span>
                  ))}
                  <span style={{ fontSize: 10, color: "#aaa", marginLeft: 2, alignSelf: "center" }}>
                    AI grounded on your data
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div style={{
                maxHeight: 340, overflowY: "auto",
                display: "flex", flexDirection: "column", gap: 12,
                marginBottom: 12, paddingRight: 4,
              }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: 5 }}>
                      {/* ── STEP 2: Confidence + Risk badges ── */}
                      {msg.role === "assistant" && msg.confidence && (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{
                            fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600,
                            background: msg.confidence === "High" ? "#E1F5EE" : msg.confidence === "Medium" ? "#FAEEDA" : "#FBEAF0",
                            color: msg.confidence === "High" ? "#1D9E75" : msg.confidence === "Medium" ? "#BA7517" : "#D4537E",
                            border: `1px solid ${msg.confidence === "High" ? "#1D9E7533" : msg.confidence === "Medium" ? "#BA751733" : "#D4537E33"}`,
                          }}>
                            {msg.confidence === "High" ? "●" : msg.confidence === "Medium" ? "◑" : "○"} {msg.confidence} Confidence
                          </span>
                        </div>
                      )}
                      {/* Bubble */}
                      <div style={{
                        padding: "11px 14px",
                        borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        background: msg.role === "user"
                          ? "linear-gradient(135deg, #1D9E75, #378ADD)"
                          : "#f7f7f5",
                        border: msg.role === "assistant" ? "0.5px solid #e5e7eb" : "none",
                        color: msg.role === "user" ? "#fff" : "#111",
                        fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap",
                      }}>
                        {msg.text}
                      </div>
                      {/* Risk note */}
                      {msg.role === "assistant" && msg.riskNote && (
                        <div style={{
                          fontSize: 11, padding: "5px 10px", borderRadius: 7,
                          background: "#FAEEDA", color: "#BA7517",
                          border: "1px solid #BA751722",
                        }}>
                          ⚠️ {msg.riskNote}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: 5, padding: 6 }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{
                        width: 7, height: 7, borderRadius: "50%", background: "#1D9E75",
                        display: "inline-block",
                        animation: `dot 1.2s ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick questions */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {QUICK_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} disabled={aiLoading} style={{
                    padding: "5px 11px", borderRadius: 20, fontSize: 12,
                    border: "1px solid #d1fae5", background: "#f0fdf8",
                    color: "#1D9E75", cursor: "pointer",
                  }}>{q}</button>
                ))}
              </div>

              {/* Input row */}
              <div style={{
                display: "flex", gap: 8,
                background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 12, padding: "8px 12px",
              }}>
                <textarea
                  rows={2}
                  placeholder="Ask about your FD plan — answers are grounded in your actual data..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  style={{
                    flex: 1, background: "transparent", border: "none",
                    fontSize: 13, fontFamily: "inherit", resize: "none", outline: "none",
                    color: "#111", lineHeight: 1.5,
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={aiLoading || !chatInput.trim()}
                  style={{
                    padding: "0 14px", borderRadius: 9, border: "none", alignSelf: "flex-end",
                    height: 36, fontSize: 16,
                    background: aiLoading || !chatInput.trim()
                      ? "#e5e7eb"
                      : "linear-gradient(135deg, #1D9E75, #378ADD)",
                    color: aiLoading || !chatInput.trim() ? "#aaa" : "#fff",
                    cursor: aiLoading || !chatInput.trim() ? "not-allowed" : "pointer",
                  }}
                >↑</button>
              </div>
            </div>
          )}

          {/* Summary Metrics */}
          <div style={cardStyle}>
            <div style={sectionTitle}>Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <MetricCard label="Total at maturity" value={fmt(results.totalMaturity)} />
              <MetricCard label="Net after tax" value={fmt(results.totalNet)} color="#1D9E75" />
              <MetricCard label="Total tax paid" value={fmt(results.totalTax)} color="#BA7517" />
            </div>
          </div>

          {/* Bar Chart */}
          <div style={cardStyle}>
            <div style={sectionTitle}>Growth visualization</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={results.rungs}>
                <XAxis dataKey="tenure" tickFormatter={(v) => `${v}yr`} />
                <YAxis tickFormatter={(v) => "₹" + (v / 1000).toFixed(0) + "K"} />
                <Tooltip formatter={(value) => fmt(value)} labelFormatter={(v) => `Tenure: ${v} yr`} />
                <Bar dataKey="maturity" radius={[6, 6, 0, 0]} fill="#378ADD" name="Maturity value" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ladder Visualization */}
          <div style={cardStyle}>
            <div style={sectionTitle}>Your FD ladder</div>
            {results.rungs.map((r, i) => (
              <LadderRung key={i} rung={r} index={i} maxMat={Math.max(...results.rungs.map((x) => x.maturity))} />
            ))}
          </div>

          {/* Maturity Schedule */}
          <div style={cardStyle}>
            <div style={sectionTitle}>Maturity schedule</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Maturity date", "Principal", "Rate", "Interest", `Tax (${Math.round(results.tax * 100)}%)`, "Net payout"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 10px", fontWeight: 500, color: "#888", borderBottom: "0.5px solid #e5e5e5", fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rungs.map((r, i) => {
                    const d = new Date();
                    d.setFullYear(d.getFullYear() + r.tenure);
                    return (
                      <tr key={i}>
                        <td style={tdStyle}>{d.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</td>
                        <td style={tdStyle}>{fmt(r.principal)}</td>
                        <td style={tdStyle}>{r.rate}%</td>
                        <td style={tdStyle}>{fmt(r.interest)}</td>
                        <td style={tdStyle}>{fmt(r.taxAmt)}</td>
                        <td style={{ ...tdStyle, fontWeight: 500, color: "#1D9E75" }}>{fmt(r.principal + r.netReturn)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comparison */}
          <div style={cardStyle}>
            <div style={sectionTitle}>Ladder vs single FD</div>
            <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <CompareCard label="FD ladder strategy" value={fmt(results.totalNet)} highlight={results.totalNet >= results.singleFDNet} />
              <CompareCard label={`Single ${results.dur}yr FD @ ${results.singleRate}%`} value={fmt(results.singleFDNet)} highlight={results.singleFDNet > results.totalNet} />
            </div>
            <p style={{ fontSize: 13, color: "#888" }}>
              Ladder gives you{" "}
              <strong style={{ color: "#111" }}>
                {results.totalNet >= results.singleFDNet ? "+" : "-"}{fmt(Math.abs(gain))}
              </strong>{" "}
              in net returns, plus liquidity at every maturity.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Why Card ──────────────────────────────────────────────────────────────────
function WhyCard({ icon, color, bg, label, value, desc }) {
  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${color}22`,
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: bg, color, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 700,
      }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#aaa", lineHeight: 1.4 }}>{desc}</div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div style={{ background: "#f7f7f5", borderRadius: 8, padding: "0.85rem 1rem" }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: color || "#111" }}>{value}</div>
    </div>
  );
}

function LadderRung({ rung, index, maxMat }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0.85rem 1rem", borderRadius: 8, border: "0.5px solid #e5e5e5", marginBottom: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: rung.bg, color: rung.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
        {index + 1}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{"₹" + Math.round(rung.principal).toLocaleString("en-IN")}</span>
          <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: rung.bg, color: rung.color, fontWeight: 500 }}>
            {rung.tenure}yr @ {rung.rate}%
          </span>
        </div>
        <div style={{ height: 8, background: "#f0f0ee", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.round((rung.maturity / maxMat) * 100)}%`, background: rung.color, borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ minWidth: 120, textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{"₹" + Math.round(rung.maturity).toLocaleString("en-IN")}</div>
        <div style={{ fontSize: 11, color: "#888" }}>Matures in {rung.tenure} yr</div>
      </div>
    </div>
  );
}

function CompareCard({ label, value, highlight }) {
  return (
    <div style={{ flex: 1, padding: "0.85rem 1rem", borderRadius: 8, border: highlight ? "1.5px solid #1D9E75" : "0.5px solid #e5e5e5" }}>
      <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 500 }}>{value}</div>
      {highlight && (
        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#E1F5EE", color: "#0F6E56", fontWeight: 500, display: "inline-block", marginTop: 4 }}>
          Recommended
        </span>
      )}
    </div>
  );
}

const cardStyle = { background: "#fff", borderRadius: 16, padding: "1.5rem", marginBottom: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", animation: "fadeIn 0.5s ease" };
const sectionTitle = { fontSize: 12, fontWeight: 500, color: "#888", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "1rem" };
const labelStyle = { fontSize: 13, color: "#888", display: "block", marginBottom: 6 };
const inputStyle = { width: "100%", padding: "10px 14px", fontSize: 14, border: "1px solid #e5e7eb", borderRadius: "10px", background: "#f9fafb", outline: "none" };
const primaryBtn = { padding: "12px 22px", fontSize: 14, fontWeight: 600, border: "none", borderRadius: "10px", background: "linear-gradient(135deg, #1D9E75, #378ADD)", color: "#fff", cursor: "pointer" };
const secondaryBtn = { padding: "12px 22px", fontSize: 14, fontWeight: 500, border: "1px solid #e5e7eb", borderRadius: "10px", background: "#fff", color: "#111", cursor: "pointer" };
const tdStyle = { padding: "8px 10px", borderBottom: "0.5px solid #f0f0ee", color: "#111" };