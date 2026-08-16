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
    <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ width: "280px", borderRight: "1px solid #ddd", padding: "1rem", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Conversations</h2>
          <button onClick={createNew} style={{ padding: "4px 8px", fontSize: "0.8rem" }}>+ New</button>
        </div>
        {conversations.map((c) => (
          <div key={c.id} onClick={() => setActiveConv(c)} style={{ padding: "0.5rem", cursor: "pointer", borderRadius: "4px", marginBottom: "0.25rem", background: activeConv?.id === c.id ? "#e8f0fe" : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{c.title}</div>
              <div style={{ fontSize: "0.7rem", color: "#666" }}>{c.messages.length} msgs · {c.tokenCount} tokens</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", fontSize: "0.8rem" }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1rem", borderBottom: "1px solid #ddd", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} style={{ padding: "4px 8px" }}>
            <option value="">No template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name} - {t.description}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {messages.length === 0 && !streaming && (
            <div style={{ textAlign: "center", color: "#999", marginTop: "4rem" }}>
              <p style={{ fontSize: "1.2rem" }}>AI Starter Kit</p>
              <p>Start a conversation or select a template above.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} style={{ marginBottom: "1rem", padding: "0.75rem", borderRadius: "8px", background: m.role === "user" ? "#e8f0fe" : "#f5f5f5", maxWidth: "80%", marginLeft: m.role === "user" ? "auto" : 0 }}>
              <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: "0.25rem" }}>{m.role} {m.tokens ? `· ${m.tokens} tokens` : ""}</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          ))}
          {streaming && (
            <div style={{ marginBottom: "1rem", padding: "0.75rem", borderRadius: "8px", background: "#f5f5f5", maxWidth: "80%" }}>
              <div style={{ fontSize: "0.7rem", color: "#666", marginBottom: "0.25rem">assistant · streaming</div>
              <div style={{ whiteSpace: "pre-wrap" }}>{streaming}</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSend} style={{ padding: "1rem", borderTop: "1px solid #ddd", display: "flex", gap: "0.5rem" }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." disabled={loading} style={{ flex: 1, padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc" }} />
          <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem", borderRadius: "4px", border: "none", background: "#000", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
