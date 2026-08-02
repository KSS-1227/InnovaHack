import { useEffect, useRef, useState } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { getAccessToken } from "../../auth/tokenStore";
import { useAuth } from "../../auth/AuthContext";

interface Citation {
  source: string;
  page?: number;
  confidence?: number;
}

interface Evidence {
  entities?: any[];
  relationships?: any[];
  text_chunks?: any[];
  images?: any[];
}

interface AssistantResponse {
  answer: string;
  evidence?: Evidence;
  citations?: Citation[];
  processing_time_seconds?: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AssistantResponse;
}

const API = "/api";

const suggestedQuestions = [
  "Summarize this compliance report",
  "List all security risks",
  "Which ISO controls are violated?",
  "Find vendor related compliance issues",
  "Explain the highest priority findings",
];

export default function AIAssistantPage() {
  const { workspaceId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [caseId, setCaseId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  function authHeaders(): Record<string, string> {
    const token = getAccessToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (workspaceId) headers["X-Workspace-ID"] = workspaceId;
    return headers;
  }

  async function askQuestion() {
    if (!question.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuestion = question;
    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/query/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          question: currentQuestion,
          case_id: caseId,
          top_k: 10,
        }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.result?.answer ?? data.answer ?? "No answer returned.",
        response: data.result ?? data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="h-screen bg-[#09090B] text-white flex">

      {/* Sidebar */}

      <aside className="w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col">

        <div className="p-6 border-b border-zinc-800">

          <div className="flex items-center gap-3">

            <Sparkles
              className="text-cyan-400"
              size={24}
            />

            <div>

              <h2 className="font-bold text-lg">

                AI Assistant

              </h2>

              <p className="text-xs text-zinc-500">

                GraphRAG Powered

              </p>

            </div>

          </div>

        </div>

        <div className="p-5">

          <button
            className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-600 py-3 font-medium"
            onClick={() =>
              setMessages([])
            }
          >

            New Conversation

          </button>

        </div>

        <div className="px-5 pb-4">
          <label className="block text-xs text-zinc-400 mb-1">Case ID (required)</label>
          <input
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            placeholder="Paste your case_id here"
            className="w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div className="px-5">

          <h3 className="text-sm text-zinc-400 mb-3">

            Suggested Questions

          </h3>

          <div className="space-y-3">

            {suggestedQuestions.map(
              (q) => (
                <button
                  key={q}
                  onClick={() =>
                    setQuestion(q)
                  }
                  className="text-left w-full rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 p-3 text-sm"
                >
                  {q}
                </button>
              )
            )}

          </div>

        </div>

      </aside>

      {/* Chat */}

      <main className="flex-1 flex flex-col">

        {/* Header */}

        <div className="border-b border-zinc-800 px-8 py-5">

          <h1 className="text-2xl font-bold">

            Enterprise Compliance Assistant

          </h1>

          <p className="text-zinc-400 mt-1">

            Ask questions over your
            Knowledge Graph.

          </p>

        </div>

        {/* Messages */}

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">

          {!caseId.trim() && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-300">
              ⚠️ Enter a <strong>Case ID</strong> in the left sidebar before sending a question.
            </div>
          )}

          {messages.length === 0 && (

            <div className="flex flex-col items-center justify-center h-full">

              <Bot
                size={64}
                className="text-cyan-400"
              />

              <h2 className="text-3xl font-bold mt-6">

                Ask anything...

              </h2>

              <p className="text-zinc-500 mt-3">

                GraphRAG will search
                your enterprise
                knowledge graph.

              </p>

            </div>

          )}

          {messages.map((msg) => (

            <div
              key={msg.id}
              className={`flex gap-4 ${
                msg.role === "user"
                  ? "justify-end"
                  : ""
              }`}
            >

              {msg.role ===
                "assistant" && (

                <Bot
                  className="text-cyan-400 mt-2"
                  size={22}
                />

              )}

              <div
                className={`max-w-4xl rounded-2xl p-5 ${
                  msg.role === "assistant"
                    ? "bg-zinc-900 border border-zinc-800"
                    : "bg-cyan-600"
                }`}
              >

                <p className="leading-7 whitespace-pre-wrap">

                  {msg.content}

                </p>

              </div>

              {msg.role ===
                "user" && (

                <User
                  className="mt-2"
                  size={22}
                />

              )}

            </div>

          ))}

          {loading && (

            <div className="flex gap-3">

              <Bot
                className="text-cyan-400"
              />

              <Loader2 className="animate-spin" />

            </div>

          )}

          <div ref={messagesEndRef} />

        </div>

        {/* Input */}
                {/* Bottom Input */}

        <div className="border-t border-zinc-800 p-6">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  askQuestion();
                }
              }}
              placeholder="Ask anything about your compliance documents..."
              rows={3}
              className="w-full resize-none bg-transparent outline-none text-white placeholder:text-zinc-500"
            />

            <div className="flex items-center justify-between mt-4">

              <div className="flex gap-2">

                <button
                  onClick={() => setMessages([])}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 hover:bg-zinc-800"
                >
                  <Trash2 size={16} />
                  Clear
                </button>

              </div>

              <button
                disabled={loading || !question.trim() || !caseId.trim()}
                onClick={askQuestion}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 px-6 py-3 font-medium transition"
                title={!caseId.trim() ? 'Enter a Case ID in the sidebar first' : ''}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}

                Send
              </button>

            </div>

          </div>

        </div>

      </main>

      {/* Evidence Panel */}

      <aside className="w-[360px] border-l border-zinc-800 bg-zinc-950 overflow-y-auto">

        <div className="p-6 border-b border-zinc-800">

          <h2 className="text-lg font-semibold">

            Evidence

          </h2>

          <p className="text-sm text-zinc-500 mt-1">

            Supporting information used by GraphRAG

          </p>

        </div>

        <div className="p-5 space-y-4">

          {messages.length > 0 &&
          messages[messages.length - 1].response?.evidence ? (

            <>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">

                <h3 className="font-semibold mb-2">

                  Entities

                </h3>

                <p className="text-3xl font-bold text-cyan-400">

                  {messages[messages.length - 1].response?.evidence?.entities?.length || 0}

                </p>

              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">

                <h3 className="font-semibold mb-2">

                  Relationships

                </h3>

                <p className="text-3xl font-bold text-violet-400">

                  {messages[messages.length - 1].response?.evidence?.relationships?.length || 0}

                </p>

              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">

                <h3 className="font-semibold mb-2">

                  Text Chunks

                </h3>

                <p className="text-3xl font-bold text-emerald-400">

                  {messages[messages.length - 1].response?.evidence?.text_chunks?.length || 0}

                </p>

              </div>

            </>

          ) : (

            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center text-zinc-500">

              Ask a question to view retrieved evidence.

            </div>

          )}

        </div>

      </aside>

    </div>

  );

}