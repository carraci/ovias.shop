"use client";
import { languages } from "@/lib/markets";
import Link from "next/link";
import { usePreferences } from "./preferences";
export function DisplayPrice({ amount }: { amount: number }) {
  const { format } = usePreferences();
  return <>{format(amount)}</>;
}
export function PreferencesLink() {
  const { preferences } = usePreferences();
  return (
    <Link href="/preferences" aria-label="Country, language and currency preferences">
      {preferences.country} · {languages.find(([code]) => code === preferences.locale)?.[1] || "English"} · {preferences.currency} ↗
    </Link>
  );
}
