const originalFetch = globalThis.fetch;
if (!process.env.OVIA_DEMO_FIXTURE_ORIGIN || !/^ovia_verification_/.test(process.env.MONGODB_DB || "")) throw new Error("Disposable verification database and provider fixture are required.");
globalThis.fetch = function(input, init) {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  if (url.hostname === "api.razorpay.com" || url.hostname === "api.resend.com") return originalFetch(new URL(url.pathname + url.search, process.env.OVIA_DEMO_FIXTURE_ORIGIN), init);
  if (!["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) throw new Error(`External HTTP request blocked in isolated demo: ${url.hostname}`);
  return originalFetch(input, init);
};
