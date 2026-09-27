"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { request } from "./store-provider";
import type { Address } from "@/lib/types";
type Saved = Address & { id: string };
export function AddressBook() {
  const [addresses, setAddresses] = useState<Saved[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Saved | null>(null);
  async function load() {
    setAddresses(await request<Saved[]>("account/addresses"));
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  return (
    <section className="section content-page">
      <p className="eyebrow">YOUR OVIA</p>
      <h1>Familiar places.</h1>
      <Link href="/account" className="text-link">
        Back to your account
      </Link>
      <div className="address-list">
        {addresses.map((a) => (
          <article key={a.id}>
            <h3>{a.name}</h3>
            <p>
              {a.line1}
              <br />
              {a.city}, {a.region} {a.postalCode}
            </p>
            <button className="text-link" onClick={() => setEditing(a)}>
              Edit
            </button>
            <button
              className="text-link"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await request(`account/addresses/${a.id}`, "DELETE");
                  await load();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Remove
            </button>
          </article>
        ))}
      </div>
      <h2 className="address-title">
        {editing ? "Edit address" : "Save an address"}
      </h2>
      <form
        key={editing?.id || "new"}
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          setBusy(true);
          setError("");
          try {
            await request(
              `account/addresses${editing ? `/${editing.id}` : ""}`,
              editing ? "PATCH" : "POST",
              { ...Object.fromEntries(new FormData(form)), country: "IN" },
            );
            setEditing(null);
            form.reset();
            await load();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="form-row">
          <label>
            Full name
            <input
              name="name"
              defaultValue={editing?.name}
              minLength={2}
              required
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input
              name="email"
              defaultValue={editing?.email}
              type="email"
              required
              autoComplete="email"
            />
          </label>
        </div>
        <label>
          Street address
          <input
            name="line1"
            defaultValue={editing?.line1}
            minLength={5}
            required
            autoComplete="street-address"
          />
        </label>
        <div className="form-row">
          <label>
            City
            <input
              name="city"
              defaultValue={editing?.city}
              minLength={2}
              required
              autoComplete="address-level2"
            />
          </label>
          <label>
            State
            <input
              name="region"
              defaultValue={editing?.region}
              minLength={2}
              required
              autoComplete="address-level1"
            />
          </label>
        </div>
        <label>
          Postal code
          <input
            name="postalCode"
            defaultValue={editing?.postalCode}
            pattern="[1-9][0-9]{5}"
            required
            maxLength={6}
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button dark" disabled={busy}>
          {busy ? "Saving…" : "Save address"}
        </button>
        {editing && (
          <button type="button" onClick={() => setEditing(null)}>
            Cancel edit
          </button>
        )}
      </form>
    </section>
  );
}
