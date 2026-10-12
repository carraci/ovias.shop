export const markets = [
  { code: "CN", name: "China Mainland", currency: "CNY", checkout: false },
  { code: "HK", name: "Hong Kong SAR", currency: "HKD", checkout: false },
  { code: "KR", name: "Korea", currency: "KRW", checkout: false },
  { code: "MO", name: "Macau SAR", currency: "MOP", checkout: false },
  { code: "MY", name: "Malaysia", currency: "MYR", checkout: false },
  { code: "SG", name: "Singapore", currency: "SGD", checkout: false },
  { code: "TW", name: "Taiwan region", currency: "TWD", checkout: false },
  { code: "TH", name: "Thailand", currency: "THB", checkout: false },
  { code: "AD", name: "Andorra", currency: "EUR", checkout: false },
  { code: "AT", name: "Austria", currency: "EUR", checkout: false },
  { code: "BE", name: "Belgium", currency: "EUR", checkout: false },
  { code: "HR", name: "Croatia", currency: "EUR", checkout: false },
  { code: "CY", name: "Cyprus", currency: "EUR", checkout: false },
  { code: "CZ", name: "Czech Republic", currency: "CZK", checkout: false },
  { code: "DK", name: "Denmark", currency: "DKK", checkout: false },
  { code: "EE", name: "Estonia", currency: "EUR", checkout: false },
  { code: "FI", name: "Finland", currency: "EUR", checkout: false },
  { code: "GR", name: "Greece", currency: "EUR", checkout: false },
  { code: "HU", name: "Hungary", currency: "HUF", checkout: false },
  { code: "IE", name: "Ireland", currency: "EUR", checkout: false },
  { code: "IT", name: "Italy", currency: "EUR", checkout: false },
  { code: "LV", name: "Latvia", currency: "EUR", checkout: false },
  { code: "LI", name: "Liechtenstein", currency: "CHF", checkout: false },
  { code: "LT", name: "Lithuania", currency: "EUR", checkout: false },
  { code: "LU", name: "Luxembourg", currency: "EUR", checkout: false },
  { code: "MT", name: "Malta", currency: "EUR", checkout: false },
  { code: "MC", name: "Monaco", currency: "EUR", checkout: false },
  { code: "NL", name: "Netherlands", currency: "EUR", checkout: false },
  { code: "NO", name: "Norway", currency: "NOK", checkout: false },
  { code: "PL", name: "Poland", currency: "PLN", checkout: false },
  { code: "PT", name: "Portugal", currency: "EUR", checkout: false },
  { code: "RO", name: "Romania", currency: "RON", checkout: false },
  { code: "SK", name: "Slovakia", currency: "EUR", checkout: false },
  { code: "SI", name: "Slovenia", currency: "EUR", checkout: false },
  { code: "ES", name: "Spain", currency: "EUR", checkout: false },
  { code: "SE", name: "Sweden", currency: "SEK", checkout: false },
  { code: "CH", name: "Switzerland", currency: "CHF", checkout: false },
  { code: "BR", name: "Brazil", currency: "BRL", checkout: false },
  { code: "MX", name: "Mexico", currency: "MXN", checkout: false },
  { code: "KW", name: "Kuwait", currency: "KWD", checkout: false },
  { code: "LB", name: "Lebanon", currency: "LBP", checkout: false },
  { code: "QA", name: "Qatar", currency: "QAR", checkout: false },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", checkout: false },
  { code: "TR", name: "Turkey", currency: "TRY", checkout: false },
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
  "AUD", "CNY", "HKD", "KRW", "MOP", "MYR", "SGD", "TWD", "THB", "CZK", "DKK", "HUF", "CHF", "NOK", "PLN", "RON", "SEK", "BRL", "MXN", "KWD", "LBP", "QAR", "SAR", "TRY",
] as const;
export type Currency = (typeof currencies)[number];
export type Preferences = {
  country: string;
  currency: Currency;
  locale: string;
};
export const defaultPreferences: Preferences = {
  country: "IN",
  currency: "INR",
  locale: "en-IN",
};
export type Rate = { currency: Currency; rate: number; date: string };
const inrFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });
const inrDigits = inrFormatter.resolvedOptions().maximumFractionDigits ?? 2;
export function displayMoney(
  paise: number,
  currency: Currency = "INR",
  rate = 1,
  locale = "en-IN",
) {
  const formatter = currency === "INR" && locale === "en-IN" ? inrFormatter : new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  });
  const digits = formatter === inrFormatter ? inrDigits : formatter.resolvedOptions().maximumFractionDigits ?? 2;
  const units = Math.round((paise / 100) * rate * 10 ** digits) / 10 ** digits;
  return formatter.format(units);
}

export const languages = [
  ["en","English"], ["hi","हिन्दी"], ["fr","Français"], ["de","Deutsch"], ["ar","العربية"], ["ja","日本語"], ["zh-CN","简体中文"], ["zh-TW","繁體中文"], ["ko","한국어"], ["ms","Bahasa Melayu"], ["th","ไทย"], ["ca","Català"], ["hr","Hrvatski"], ["el","Ελληνικά"], ["cs","Čeština"], ["da","Dansk"], ["et","Eesti"], ["fi","Suomi"], ["hu","Magyar"], ["it","Italiano"], ["lv","Latviešu"], ["lt","Lietuvių"], ["nl","Nederlands"], ["no","Norsk"], ["pl","Polski"], ["pt","Português"], ["ro","Română"], ["sk","Slovenčina"], ["sl","Slovenščina"], ["es","Español"], ["sv","Svenska"], ["tr","Türkçe"],
] as const;
export function countryLocale(country: string) {
  const defaults: Record<string,string> = {IN:"en",CN:"zh-CN",HK:"zh-TW",MO:"zh-TW",TW:"zh-TW",JP:"ja",KR:"ko",MY:"ms",TH:"th",AD:"ca",AT:"de",BE:"fr",HR:"hr",CY:"el",CZ:"cs",DK:"da",EE:"et",FI:"fi",FR:"fr",DE:"de",GR:"el",HU:"hu",IT:"it",LV:"lv",LI:"de",LT:"lt",LU:"fr",MT:"en",MC:"fr",NL:"nl",NO:"no",PL:"pl",PT:"pt",RO:"ro",SK:"sk",SI:"sl",ES:"es",SE:"sv",CH:"de",BR:"pt",MX:"es",KW:"ar",LB:"ar",QA:"ar",SA:"ar",TR:"tr",AE:"ar"};
  return defaults[country] || "en";
}
