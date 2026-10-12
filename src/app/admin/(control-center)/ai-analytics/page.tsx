"use client";
import { useEffect, useRef, useState } from "react";
import { Send, Plus } from "lucide-react";
import { requestCopilot } from "@/lib/ai-request";
import styles from "./ai-chat.module.css";
type Message = { role: "user" | "assistant"; content: string };
export default function AdminAiAnalyticsPage() {
  const [name, setName] = useState(""),
    [messages, setMessages] = useState<Message[]>([]),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [configured, setConfigured] = useState(false);
  const bottom = useRef<HTMLDivElement>(null),
    request = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/ai-copilot", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setName(data.name.split(" ")[0]);
        setConfigured(!!data.configured);
      })
      .catch(() => {});
    return () => {
      controller.abort();
      request.current?.abort();
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);
  async function send() {
    const question = query.trim();
    if (!question || request.current) return;
    const history = messages.slice(-10);
    setMessages([...messages, { role: "user", content: question }]);
    setQuery("");
    setLoading(true);
    setError("");
    const controller = new AbortController();
    request.current = controller;
    try {
      const answer = await requestCopilot(question, history, controller.signal);
      if (request.current !== controller) return;
      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: answer },
      ]);
    } catch (e) {
      if (request.current === controller) {
        if (e instanceof Error && (e.name === "AbortError" || e.message.toLowerCase().includes("abort"))) {
          return;
        }
        setError(e instanceof Error ? e.message : "Unable to connect.");
        setMessages((previous) => previous.slice(0, -1));
        setQuery(question);
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }
  return (
    <section className={styles.chat} aria-label="OVIA AI assistant">
      {messages.length > 0 && (
        <button
          className={styles.newChat}
          onClick={() => {
            const pending = request.current;
            request.current = null;
            pending?.abort();
            setLoading(false);
            setMessages([]);
            setError("");
            setQuery("");
          }}
        >
          <Plus size={15} />
          New chat
        </button>
      )}
      <div className={messages.length ? styles.conversation : styles.welcome}>
        {!messages.length ? (
          <>
            <div className={styles.orb} aria-hidden="true" />
            <h1>Good to see you{name ? `, ${name}` : ""}.</h1>
          </>
        ) : (
          <div className={styles.messages} aria-live="polite">
            {messages.map((message, i) => (
              <article
                key={i}
                className={
                  message.role === "user" ? styles.user : styles.assistant
                }
              >
                <span>{message.role === "user" ? "You" : "OVIA AI"}</span>
                <p>{message.content}</p>
              </article>
            ))}
            {loading && (
              <p className={styles.thinking} role="status">
                Thinking…
              </p>
            )}
            <div ref={bottom} />
          </div>
        )}
      </div>
      <div className={styles.composer}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            aria-label="Ask OVIA AI"
            placeholder="Ask me anything…"
            value={query}
            maxLength={4000}
            rows={1}
            disabled={loading}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={loading || !query.trim()}
          >
            <Send size={18} />
          </button>
        </form>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <p className={styles.status}>
          {configured
            ? "OVIA AI · Store assistant"
            : "AI provider setup required"}
        </p>
      </div>
    </section>
  );
}
