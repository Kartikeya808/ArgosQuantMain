import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { aiService } from "@/services";
import type { AIMessage } from "@/types";
import styles from "./Assistant.module.css";

export function Assistant() {
  const [messages, setMessages] = useState<AIMessage[]>(() => aiService.getSeedMessages());
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const prompts = aiService.getSuggestedPrompts();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || typing) return;
    const userMsg: AIMessage = {
      id: `u-${Date.now().toString(36)}`,
      role: "user",
      content: question,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    const reply = await aiService.sendMessage(question);
    setTyping(false);
    setMessages((prev) => [...prev, reply]);
  }

  const showPrompts = messages.filter((m) => m.role === "user").length === 0;

  return (
    <div className="page">
      <Card padded={false} className={styles.shell}>
        {/* ---- header ---- */}
        <div className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.avatar}>
              <Icon name="sparkles" size={18} />
            </span>
            <div>
              <h1 className={styles.title}>ARGOS ASSISTANT</h1>
              <span className={styles.subtitle}>Portfolio Intelligence</span>
            </div>
          </div>
          <span className={styles.status}>
            <span className={styles.statusDot} />
            CONNECTED
          </span>
        </div>

        {/* ---- conversation ---- */}
        <div className={styles.thread} ref={scrollRef}>
          {messages.map((m) => (
            <div key={m.id} className={`${styles.msg} ${m.role === "user" ? styles.user : styles.assistant}`}>
              {m.role === "assistant" && (
                <span className={styles.msgAvatar}>
                  <Icon name="sparkles" size={14} />
                </span>
              )}
              <div className={styles.bubbleGroup}>
                <div className={styles.bubble}>{m.content}</div>
                {m.metrics && m.metrics.length > 0 && (
                  <div className={styles.metricBlock}>
                    {m.metrics.map((metric) => (
                      <div key={metric.label} className={styles.metricRow}>
                        <span className={styles.metricLabel}>{metric.label}</span>
                        <span
                          className={`${styles.metricValue} mono ${
                            metric.direction === "pos"
                              ? "val-pos"
                              : metric.direction === "neg"
                              ? "val-neg"
                              : ""
                          }`}
                        >
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <span className={styles.time}>{m.time}</span>
              </div>
            </div>
          ))}

          {typing && (
            <div className={`${styles.msg} ${styles.assistant}`}>
              <span className={styles.msgAvatar}>
                <Icon name="sparkles" size={14} />
              </span>
              <div className={styles.typing}>
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        {/* ---- suggested prompts ---- */}
        {showPrompts && (
          <div className={styles.prompts}>
            {prompts.map((p) => (
              <button key={p} className={styles.prompt} onClick={() => send(p)}>
                {p}
              </button>
            ))}
          </div>
        )}

        {/* ---- composer ---- */}
        <form
          className={styles.composer}
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <input
            className={styles.inputField}
            placeholder="Ask about your returns, risk, allocation…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button variant="primary" icon="send" type="submit" disabled={!input.trim() || typing}>
            Ask
          </Button>
        </form>

        <div className={styles.disclaimer}>
          <Icon name="shield" size={13} />
          <span>
            Argos explains your verified ArgosQuant metrics only. It does not predict prices, place
            trades, or give investment advice.
          </span>
          <Badge tone="neutral" size="sm">
            Mock responses
          </Badge>
        </div>
      </Card>
    </div>
  );
}
