import { useState, useEffect, useRef } from "react";

interface Message {
  id: string;
  role: string;
  content: string;
  tokens?: number;
  createdAt?: string;
}

interface Conversation {
  id: string;
  title: string;
  template?: string;
  messages: Message[];
  tokenCount: number;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [input, setInput] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchTemplates();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, streaming]);

  async function fetchConversations() {
    const res = await fetch("/api/chat?action=conversations&userId=default");
    const data = await res.json();
    setConversations(data.conversations || []);
  }

  async function fetchTemplates() {
    const res = await fetch("/api/chat?action=templates");
    const data = await res.json();
    setTemplates(data.templates || []);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() && !selectedTemplate) return;
    setLoading(true);
    setStreaming("");

    const userMessage = input;
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          conversationId: activeConv?.id,
          userId: "default",
          template: selectedTemplate || undefined,
          templateInput: selectedTemplate ? userMessage : undefined,
        }),
      });

      const convId = res.headers.get("x-conversation-id");
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices?.[0]?.delta?.content || "";
              fullText += token;
              setStreaming(fullText);
            } catch {}
          }
        }
      }

      await fetchConversations();
      if (convId) {
        const convRes = await fetch(`/api/chat?action=conversation&id=${convId}`);
        const convData = await convRes.json();
        setActiveConv(convData.conversation);
      }
    } catch (err) {
      setStreaming("Error occurred");
    }

    setLoading(false);
    setStreaming("");
  }

  async function createNew() {
    setActiveConv(null);
    setSelectedTemplate("");
    setInput("");
  }

  async function deleteConversation(id: string) {
    await fetch(`/api/chat?id=${id}`, { method: "DELETE" });
    if (activeConv?.id === id) setActiveConv(null);
    fetchConversations();
  }

  const messages = activeConv?.messages.filter((m) => m.role !== "system") || [];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", background: "#f1f5f9" }}>
      <div style={{ width: 280, background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", color: "#e2e8f0", display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "4px 0 24px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1e293b" }}>
          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>AI Starter Kit</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: 4 }}>Your AI-powered workspace</div>
        </div>
        <div style={{ padding: "1rem 1rem 0.5rem" }}>
          <button onClick={createNew} style={{
            width: "100%", padding: "0.6rem", background: "rgba(99,102,241,0.2)", color: "#a5b4fc",
            border: "1px dashed #6366f1", borderRadius: 8, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
          }}>+ New Chat</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem 0" }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b", padding: "0.5rem 1.5rem 0.4rem", fontWeight: 600 }}>Recent</div>
          {conversations.map((c) => (
            <div key={c.id} onClick={() => setActiveConv(c)} style={{
              padding: "0.6rem 1.5rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
              background: activeConv?.id === c.id ? "rgba(99,102,241,0.15)" : "transparent",
              borderLeft: activeConv?.id === c.id ? "3px solid #818cf8" : "3px solid transparent",
              transition: "all 0.15s ease",
            }}>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: activeConv?.id === c.id ? 600 : 400, color: activeConv?.id === c.id ? "#c7d2fe" : "#94a3b8" }}>{c.title}</div>
                <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: 2 }}>{c.messages.length} msgs &middot; {c.tokenCount} tokens</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} style={{
                background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "0.85rem",
                padding: "2px 6px", borderRadius: 4, opacity: 0.5,
              }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "0.85rem 1.75rem", background: "#fff", borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.95rem" }}>
            {activeConv ? activeConv.title : "New conversation"}
          </div>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} style={{
            padding: "0.4rem 0.75rem", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: "0.8rem",
            background: "#f8fafc", color: "#475569", outline: "none",
          }}>
            <option value="">No template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem" }}>
          {messages.length === 0 && !streaming && (
            <div style={{ textAlign: "center", marginTop: "6rem" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "1.5rem", marginBottom: "1rem",
              }}>🤖</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.35rem" }}>AI Starter Kit</div>
              <div style={{ color: "#64748b", fontSize: "0.875rem" }}>Start a conversation or select a template above.</div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} style={{
              marginBottom: "1rem", display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row",
              gap: "0.6rem", alignItems: "flex-end", maxWidth: "80%", marginLeft: m.role === "user" ? "auto" : 0,
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                background: m.role === "user" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#1e293b",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "0.7rem", fontWeight: 700,
              }}>{m.role === "user" ? "You" : "AI"}</div>
              <div style={{
                padding: "0.75rem 1rem", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                background: m.role === "user" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#fff",
                color: m.role === "user" ? "#fff" : "#0f172a",
                border: m.role === "user" ? "none" : "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)", fontSize: "0.875rem", lineHeight: 1.6,
              }}>
                <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
                {m.tokens ? (
                  <div style={{ fontSize: "0.65rem", marginTop: "0.4rem", opacity: 0.6 }}>{m.tokens} tokens</div>
                ) : null}
              </div>
            </div>
          ))}
          {streaming && (
            <div style={{ marginBottom: "1rem", display: "flex", gap: "0.6rem", alignItems: "flex-end" }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, background: "#1e293b",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "0.7rem", fontWeight: 700,
              }}>AI</div>
              <div style={{
                padding: "0.75rem 1rem", borderRadius: "12px 12px 12px 2px",
                background: "#fff", border: "1px solid #e2e8f0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)", fontSize: "0.875rem", lineHeight: 1.6,
              }}>
                <div style={{ whiteSpace: "pre-wrap" }}>{streaming}</div>
                <div style={{ fontSize: "0.65rem", color: "#6366f1", marginTop: "0.4rem" }}>● streaming</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} style={{
          padding: "1rem 1.75rem 1.25rem", background: "#fff", borderTop: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-end" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." disabled={loading} style={{
              flex: 1, padding: "0.7rem 0.9rem", border: "1px solid #e2e8f0", borderRadius: 10,
              fontSize: "0.875rem", outline: "none", transition: "border-color 0.15s ease",
            }} />
            <button type="submit" disabled={loading || !input.trim()} style={{
              padding: "0.7rem 1.5rem", borderRadius: 10, border: "none",
              background: input.trim() && !loading ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#e2e8f0",
              color: input.trim() && !loading ? "#fff" : "#94a3b8",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              fontWeight: 600, fontSize: "0.875rem",
              boxShadow: input.trim() && !loading ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
              transition: "all 0.15s ease",
            }}>
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
