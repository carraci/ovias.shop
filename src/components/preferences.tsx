"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  currencies, languages, countryLocale,
  markets,
  defaultPreferences,
  displayMoney,
  type Preferences,
  type Rate,
} from "@/lib/markets";
import { PageTranslation } from "./page-translation";
import { request } from "./store-provider";
const Context = createContext({
  preferences: defaultPreferences,
  setPreferences: (_p: Preferences) => {},
  format: (v: number) => displayMoney(v),
  rates: [] as Rate[],
});
export function PreferencesProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial: Preferences;
}) {
  const [preferences, setPreferences] = useState(initial);
  const [rates, setRates] = useState<Rate[]>([]);
  useEffect(() => {
    if (preferences.currency !== "INR")
      request<{ rates: Rate[] }>("rates")
        .then((r) => setRates(r.rates))
        .catch(() => setRates([]));
  }, [preferences.currency]);
  function format(value: number) {
    const rate = rates.find((r) => r.currency === preferences.currency);
    return preferences.currency === "INR" || !rate
      ? displayMoney(value)
      : `≈ ${displayMoney(value, preferences.currency, rate.rate, preferences.locale)}`;
  }
  return (
    <Context.Provider value={{ preferences, setPreferences, format, rates }}>
      {children}
      <PageTranslation locale={preferences.locale} />
    </Context.Provider>
  );
}
export const usePreferences = () => useContext(Context);
export function RegionalSettings() {
  const { preferences, setPreferences, rates } = usePreferences();
  const [draft, setDraft] = useState(preferences);
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      setRemember(
        JSON.parse(localStorage.getItem("ovia_consent") || "{}").preferences ===
          true,
      );
    } catch {}
  }, []);
  return (
    <section className="section content-page">
      <p className="eyebrow">YOUR VIEW OF THE WORLD</p>
      <h1>
        Country, language <em>& currency.</em>
      </h1>
      <p>
        International browsing is available. India is the only demo checkout
        market; commercial shipping and international checkout await business
        configuration.
      </p>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await request("preferences", "POST", { ...draft, remember });
            setPreferences(draft);
            localStorage.setItem(
              "ovia_consent",
              JSON.stringify({
                version: 1,
                preferences: remember,
                updatedAt: new Date().toISOString(),
              }),
            );
            setMessage(
              "Preferences applied. Your bag is preserved. Checkout uses INR and an Indian address.",
            );
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Country / region
          <select
            value={draft.country}
            onChange={(e) => setDraft({ ...draft, country: e.target.value, locale:countryLocale(e.target.value), currency: markets.find(m => m.code === e.target.value)?.currency || "INR" })}
          >
            {markets.map((m) => (
              <option key={m.code} value={m.code}>
                {m.name}
                {!m.checkout ? " — browse only" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          Language
          <select value={draft.locale === "en-IN" ? "en" : draft.locale} onChange={e => setDraft({...draft,locale:e.target.value})}>
            {languages.map(([code,name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </label>
        <p className="small-note">
          Page translations use the configured translation provider.
        </p>
        <label>
          Display currency
          <select
            value={draft.currency}
            onChange={(e) =>
              setDraft({
                ...draft,
                currency: e.target.value as Preferences["currency"],
              })
            }
          >
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Remember these preferences on this device</span>
        </label>
        <button className="button dark" disabled={busy}>
          Apply preferences
        </button>
      </form>
      <p role="status">{message}</p>
      <p className="small-note">
        Converted prices are estimates.{" "}
        {preferences.currency !== "INR"
          ? rates.find((r) => r.currency === preferences.currency)
            ? `Reference rate dated ${rates.find((r) => r.currency === preferences.currency)?.date}, via Frankfurter.`
            : "Rates are unavailable or loading; original INR prices remain visible."
          : "INR is the base currency."}{" "}
        Final checkout and order history always show INR.
      </p>
    </section>
  );
}
export function CookiePreferences() {
  const { preferences, setPreferences } = usePreferences();
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    try {
      setRemember(
        JSON.parse(localStorage.getItem("ovia_consent") || "{}").preferences ===
          true,
      );
    } catch {}
  }, []);
  async function save(allow: boolean) {
    setBusy(true);
    try {
      await request("preferences", "POST", { ...preferences, remember: allow });
      localStorage.setItem(
        "ovia_consent",
        JSON.stringify({
          version: 1,
          preferences: allow,
          updatedAt: new Date().toISOString(),
        }),
      );
      setRemember(allow);
      if (!allow) setPreferences(defaultPreferences);
      setMessage("Cookie preferences saved.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section content-page">
      <p className="eyebrow">YOUR CHOICES</p>
      <h1>
        Cookie <em>preferences.</em>
      </h1>
      <div className="form">
        <label className="check-label">
          <input type="checkbox" checked disabled />
          <span>Essential — account and shopping bag</span>
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Preferences — remember region and currency</span>
        </label>
        <p>
          Analytics and advertising: not installed. No optional trackers are
          loaded.
        </p>
        <div className="account-tools">
          <button
            className="button dark"
            disabled={busy}
            onClick={() => save(remember)}
          >
            Save preferences
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={() => save(false)}
          >
            Reject optional storage
          </button>
        </div>
      </div>
      <p role="status">{message}</p>
    </section>
  );
}
