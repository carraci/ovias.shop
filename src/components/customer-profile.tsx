"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  AccountProfile,
  AccountProfileInput,
} from "@/lib/account-profile";
import { request, useStore } from "./store-provider";
import { AddressBook } from "./address-book";
import styles from "./customer-profile.module.css";
export function CustomerProfile() {
  const { user, refresh } = useStore();
  const [profile, setProfile] = useState<AccountProfile | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setProfile(null);
    request<AccountProfile>(
      "account/profile",
      "GET",
      undefined,
      AbortSignal.timeout(30000),
    )
      .then((value) => {
        if (active) {
          setProfile(value);
          setError("");
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Unable to load your profile.",
          );
      });
    return () => {
      active = false;
    };
  }, [user?.id, retry]);
  function change<K extends keyof AccountProfileInput>(
    key: K,
    value: AccountProfileInput[K],
  ) {
    setProfile((current) => (current ? { ...current, [key]: value } : current));
    setNotice("");
  }
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>MY ACCOUNT / PROFILE</p>
      <h1>Profile</h1>
      {error && (
        <p role="alert">
          {error}{" "}
          <button onClick={() => setRetry((value) => value + 1)}>
            Try again
          </button>
        </p>
      )}
      {!profile ? (
        <p role="status">
          {error ? "Profile unavailable." : "Loading your profile…"}
        </p>
      ) : (
        <>
          <form
            className={styles.panel}
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              setBusy(true);
              setError("");
              setNotice("");
              try {
                const { email: _email, ...input } = profile;
                const saved = await request<AccountProfile>(
                  "account/profile",
                  "PATCH",
                  input,
                );
                setProfile(saved);
                setNotice("Your profile has been saved.");
                await refresh();
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Unable to save your profile.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2>Personal details</h2>
            <div className={styles.row}>
              <label>
                First name *
                <input
                  required
                  autoComplete="given-name"
                  maxLength={80}
                  value={profile.firstName}
                  onChange={(event) => change("firstName", event.target.value)}
                />
              </label>
              <label>
                Last name
                <input
                  autoComplete="family-name"
                  maxLength={80}
                  value={profile.lastName}
                  onChange={(event) => change("lastName", event.target.value)}
                />
              </label>
            </div>
            <label>
              Display name *
              <input
                required
                maxLength={80}
                value={profile.displayName ?? user?.name ?? ""}
                onChange={(event) => change("displayName", event.target.value)}
              />
              <small>Your name in your account and reviews.</small>
            </label>
            <label>
              Email address
              <input
                type="email"
                autoComplete="off"
                maxLength={254}
                placeholder="Your email"
                value={profile.contactEmail || ""}
                onChange={(event) => change("contactEmail", event.target.value)}
              />
              <small>Contact email for your profile.</small>
            </label>
            <div className={styles.row}>
              <label>
                Country code
                <select
                  value={profile.phoneCountryCode}
                  onChange={(event) =>
                    change(
                      "phoneCountryCode",
                      event.target
                        .value as AccountProfileInput["phoneCountryCode"],
                    )
                  }
                >
                  {["+91", "+1", "+44", "+971", "+65"].map((code) => (
                    <option key={code}>{code}</option>
                  ))}
                </select>
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="tel"
                  pattern="[0-9]{6,15}"
                  maxLength={15}
                  value={profile.phone}
                  onChange={(event) => change("phone", event.target.value)}
                />
              </label>
            </div>
            {notice && <p role="status">{notice}</p>}
            <button disabled={busy} className={styles.primary}>
              {busy ? "Saving…" : "Save changes"}
            </button>
            <Link href="/account/security">
              Change password & account security →
            </Link>
          </form>
          <section className={styles.panel}>
            <h2>Address</h2>
            <AddressBook embedded />
          </section>
          <div className={styles.row}>
            <section className={styles.panel}>
              <h2>Showroom</h2>
              <address className={styles.showroomAddress}>
                Grand Galleria, Near East West Bridge, Opposite Yazoo Park,
                Evershine Global City, Dongarpada, Rustomjee Global City, Virar
                West, Vasai-Virar, Maharashtra 401303, India
              </address>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Grand Galleria, Near East West Bridge, Opposite Yazoo Park, Evershine Global City, Dongarpada, Rustomjee Global City, Virar West, Vasai-Virar, Maharashtra 401303, India")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions →
              </a>
              <Link href="/contact-us">Contact OVIA →</Link>
            </section>
            <section className={styles.visit}>
              <small>PERSONAL COLLECTION</small>
              <h2>Explore our bags</h2>
              <Link href="/bags">Discover the collection →</Link>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
