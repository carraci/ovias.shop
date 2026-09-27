export const markets = [
  { code: "IN", name: "India", currency: "INR", checkout: true },
  { code: "US", name: "United States", currency: "USD", checkout: false },
  { code: "GB", name: "United Kingdom", currency: "GBP", checkout: false },
  { code: "FR", name: "France", currency: "EUR", checkout: false },
  { code: "DE", name: "Germany", currency: "EUR", checkout: false },
  { code: "JP", name: "Japan", currency: "JPY", checkout: false },
  {
    code: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    checkout: false,
  },
  { code: "CA", name: "Canada", currency: "CAD", checkout: false },
  { code: "AU", name: "Australia", currency: "AUD", checkout: false },
] as const;
export const currencies = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AED",
  "CAD",
  "AUD",
] as const;
export type Currency = (typeof currencies)[number];
export type Preferences = {
  country: string;
  currency: Currency;
  locale: "en-IN";
};
export const defaultPreferences: Preferences = {
  country: "IN",
  currency: "INR",
  locale: "en-IN",
};
export type Rate = { currency: Currency; rate: number; date: string };
export function displayMoney(
  paise: number,
  currency: Currency = "INR",
  rate = 1,
  locale = "en-IN",
) {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const units = Math.round((paise / 100) * rate * 10 ** digits) / 10 ** digits;
  return formatter.format(units);
}
