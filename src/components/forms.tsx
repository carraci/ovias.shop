"use client";
import { useState } from "react";
import { request } from "./store-provider";
export function ContactForm() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        setBusy(true);
        setStatus("");
        try {
          const result = await request<{ reference: string }>(
            "contact",
            "POST",
            Object.fromEntries(new FormData(form)),
          );
          setStatus(
            `Your message has been saved. Reference: ${result.reference.slice(0, 8)}. Email delivery is not connected.`,
          );
          form.reset();
        } catch (e) {
          setStatus((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Name
        <input
          name="name"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
        />
      </label>
      <label>
        Email
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Your message
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={5}
        />
      </label>
      <button className="button dark" disabled={busy}>
        {busy ? "Saving…" : "Send message"}
      </button>
      <p role="status">{status}</p>
    </form>
  );
}
