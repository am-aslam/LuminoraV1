import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Send,
  Sparkles,
  Trash2,
  MessageSquare,
  Loader2,
  Menu,
} from "lucide-react";
import api, { API, TOKEN_KEY } from "../lib/api";
import { AIOrb } from "../components/AIOrb";
import { ProfileBadge } from "../components/ProfileBadge";

const PROMPTS = [
  "Explain quantum entanglement simply",
  "Quiz me on photosynthesis",
  "Help me solve a calculus problem",
  "Summarize World War II in 5 points",
];

export default function Tutor() {
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef(null);

  const loadConversations = async () => {
    const { data } = await api.get("/tutor/conversations");
    setConversations(data);
    return data;
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const openConversation = async (id) => {
    setActive(id);
    setSidebarOpen(false);
    const { data } = await api.get(`/tutor/conversations/${id}/messages`);
    setMessages(data);
  };

  const newConversation = async () => {
    const { data } = await api.post("/tutor/conversations");
    setConversations([data, ...conversations]);
    setActive(data.id);
    setMessages([]);
    setSidebarOpen(false);
    return data.id;
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    await api.delete(`/tutor/conversations/${id}`);
    setConversations(conversations.filter((c) => c.id !== id));
    if (active === id) {
      setActive(null);
      setMessages([]);
    }
  };

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || streaming) return;

    let convId = active;
    if (!convId) convId = await newConversation();

    setInput("");
    setMessages((m) => [...m, { role: "user", content }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch(`${API}/tutor/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
        },
        body: JSON.stringify({ conversation_id: convId, message: content }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const json = JSON.parse(line);
            if (json.delta) {
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = {
                  ...copy[copy.length - 1],
                  content: copy[copy.length - 1].content + json.delta,
                };
                return copy;
              });
            }
            if (json.error) toast.error("AI error: " + json.error);
          } catch {
            /* ignore */
          }
        }
      }
      loadConversations();
    } catch (e) {
      toast.error("Connection error");
    } finally {
      setStreaming(false);
    }
  };

  const ConvList = () => (
    <>
      <button
        data-testid="tutor-new-conversation"
        onClick={newConversation}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
      >
        <Plus size={16} /> New chat
      </button>
      <div className="space-y-1 overflow-y-auto">
        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => openConversation(c.id)}
            data-testid={`conversation-${c.id}`}
            className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition ${
              active === c.id ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5"
            }`}
          >
            <MessageSquare size={15} className="shrink-0" />
            <span className="flex-1 truncate">{c.title}</span>
            <button onClick={(e) => deleteConversation(c.id, e)} className="opacity-0 transition group-hover:opacity-100">
              <Trash2 size={14} className="text-gray-500 hover:text-red-400" />
            </button>
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-9rem)] gap-4">
      {/* Sidebar */}
      <aside className="glass hidden w-64 shrink-0 flex-col rounded-2xl p-4 md:flex">
        <ConvList />
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="glass-strong absolute left-0 top-0 h-full w-72 p-4">
            <ConvList />
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="glass flex flex-1 flex-col rounded-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 p-4">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 md:hidden">
            <Menu size={20} />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <p className="font-display font-semibold">Luminora Tutor</p>
            <p className="text-xs text-emerald-400">● Online · powered by AI</p>
          </div>
          <div className="ml-auto">
            <ProfileBadge />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <AIOrb size={90} active />
              <h3 className="mt-5 font-display text-xl font-semibold">Ask me anything</h3>
              <p className="mt-1 text-sm text-gray-500">Your personal AI tutor is ready.</p>
              <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    data-testid={`suggested-prompt`}
                    onClick={() => send(p)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-300 transition hover:bg-white/10"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  m.role === "user"
                    ? "bg-white/10"
                    : "bg-gradient-to-br from-blue-500 to-violet-600"
                }`}
              >
                {m.role === "user" ? "🧑" : <Sparkles size={15} className="text-white" />}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-blue-600/20 text-white"
                    : "border border-white/10 bg-white/5 text-gray-200"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {streaming && i === messages.length - 1 && m.role === "assistant" && !m.content && (
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                )}
              </div>
            </motion.div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
            <textarea
              data-testid="tutor-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Message your AI tutor…"
              className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-white placeholder-gray-500 outline-none"
            />
            <button
              data-testid="tutor-send"
              onClick={() => send()}
              disabled={streaming}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
