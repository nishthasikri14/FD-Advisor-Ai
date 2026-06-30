import { useState, useRef, useEffect } from "react";
import API from "./api";

const SUGGESTIONS = [
  "What is FD laddering and how does it help?",
  "Which bank is best for a 2 year FD in India?",
  "How much tax will I pay on FD interest?",
  "I have ₹3 lakh, what FD strategy should I use?",
  "What is the difference between cumulative and non-cumulative FD?",
  "How to save tax on FD interest using Section 80C?",
];

export default function AIAdvisor({ user }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! 👋 I'm your AI-powered FD Advisor. I can help you with FD strategies, tax optimization, bank comparisons, and investment planning. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setLoading(true);

    try {
      const { data } = await API.post("/ai/chat", { message: userText });
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, I couldn't connect to the AI. Please make sure the backend is running with a valid Gemini API key." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem 1rem", display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>🤖 AI FD Advisor</h1>
        <p style={{ fontSize: 14, color: "#888" }}>
          Powered by Google Gemini — ask anything about FDs, taxes, and investment strategies
        </p>
      </div>

      {/* Chat window */}
      <div style={{
        flex: 1, background: "#fff", borderRadius: 16, padding: "1.5rem",
        overflowY: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        marginBottom: 12, display: "flex", flexDirection: "column", gap: 12
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #1D9E75, #378ADD)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, marginRight: 8, marginTop: 2
              }}>🤖</div>
            )}
            <div style={{
              maxWidth: "75%", padding: "10px 14px", borderRadius: 12, fontSize: 14, lineHeight: 1.6,
              background: msg.role === "user"
                ? "linear-gradient(135deg, #1D9E75, #378ADD)"
                : "#f3f4f6",
              color: msg.role === "user" ? "#fff" : "#111",
              borderBottomRightRadius: msg.role === "user" ? 4 : 12,
              borderBottomLeftRadius: msg.role === "assistant" ? 4 : 12,
              whiteSpace: "pre-wrap"
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #1D9E75, #378ADD)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
            }}>🤖</div>
            <div style={{ background: "#f3f4f6", padding: "10px 16px", borderRadius: 12, borderBottomLeftRadius: 4 }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#888",
                    animation: "bounce 1.2s infinite",
                    animationDelay: `${i * 0.2}s`
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 8, fontWeight: 500 }}>SUGGESTED QUESTIONS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => sendMessage(s)} style={{
                padding: "6px 12px", fontSize: 12, border: "1px solid #e5e7eb",
                borderRadius: 20, background: "#fff", cursor: "pointer", color: "#555",
                transition: "all 0.2s"
              }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Ask about FDs, tax, interest rates..."
          style={{
            flex: 1, padding: "12px 16px", fontSize: 14,
            border: "1px solid #e5e7eb", borderRadius: 12,
            background: "#fff", outline: "none"
          }}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{
          padding: "12px 20px", fontSize: 14, fontWeight: 600,
          border: "none", borderRadius: 12, cursor: "pointer",
          background: "linear-gradient(135deg, #1D9E75, #378ADD)",
          color: "#fff", opacity: loading || !input.trim() ? 0.6 : 1
        }}>Send</button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}