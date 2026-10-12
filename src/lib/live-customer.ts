/** Reserved email domains and explicit fixture markers cannot represent live customers. */
export function isLiveCustomer(user: { email?: string; isDemo?: boolean; isTest?: boolean; source?: string; environment?: string }) {
  if (user.isDemo || user.isTest || ["demo", "test", "fixture", "seed"].includes(user.source || "") || user.environment === "test") return false;
  const domain = user.email?.trim().toLowerCase().split("@").at(-1);
  return !!domain && !["example.com", "example.org", "example.net", "test", "invalid", "localhost"].some(reserved => domain === reserved || domain.endsWith("." + reserved)) && !domain.endsWith(".test") && !domain.endsWith(".invalid");
}
