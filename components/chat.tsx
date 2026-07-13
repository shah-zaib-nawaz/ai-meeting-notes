"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";

export function Chat() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");

  return (
    <div style={{ maxWidth: 600, margin: "20px auto" }}>
      <h2>Apni notes se baat karo</h2>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 12,
          minHeight: 200,
          marginBottom: 12,
        }}
      >
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 12 }}>
            <strong>{m.role === "user" ? "Aap" : "AI"}:</strong>{" "}
            {m.parts.map((part, i) =>
              part.type === "text" ? <span key={i}>{part.text}</span> : null
            )}
          </div>
        ))}
        {status === "streaming" && <p>AI soch raha hai...</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Sawal poochho..."
          style={{ flex: 1 }}
        />
        <button type="submit">Bhejo</button>
      </form>
    </div>
  );
}
