import { test } from "node:test";
import assert from "node:assert/strict";
import { requestCopilot, withDeadline } from "../src/lib/ai-request";

test("chat returns the answer and sends conversation history", async () => {
  const history = [{ role: "assistant" as const, content: "Previous answer" }];
  const fetcher: typeof fetch = async (_, options) => {
    assert.deepEqual(JSON.parse(options!.body as string), {
      question: "Hello",
      messages: history,
    });
    return Response.json({ success: true, answer: "Hi" });
  };
  assert.equal(
    await requestCopilot(
      "Hello",
      history,
      new AbortController().signal,
      fetcher,
    ),
    "Hi",
  );
});

test("chat surfaces billing/auth errors and can retry after a failure", async () => {
  let attempts = 0;
  const fetcher: typeof fetch = async () =>
    ++attempts === 1
      ? Response.json({ error: "Insufficient balance" }, { status: 503 })
      : Response.json({ success: true, answer: "Recovered" });
  const signal = new AbortController().signal;
  await assert.rejects(
    requestCopilot("Hello", [], signal, fetcher),
    /Insufficient balance/,
  );
  assert.equal(await requestCopilot("Hello", [], signal, fetcher), "Recovered");
});

test("chat rejects invalid JSON and empty answers", async () => {
  for (const response of [
    new Response("Unavailable", { status: 502 }),
    Response.json({ success: true, answer: " " }),
  ]) {
    await assert.rejects(
      requestCopilot(
        "Hi",
        [],
        new AbortController().signal,
        async () => response,
      ),
      /retry/i,
    );
  }
});

test("chat bounds both a stalled fetch and a stalled response body", async () => {
  for (const fetcher of [
    async () => new Promise<Response>(() => {}),
    async () => ({ ok: true, json: () => new Promise(() => {}) }) as Response,
  ]) {
    await assert.rejects(
      requestCopilot("Hi", [], new AbortController().signal, fetcher, 10),
      /took too long/,
    );
  }
});

test("new chat cancellation aborts the pending request", async () => {
  const controller = new AbortController();
  let upstreamSignal: AbortSignal | undefined;
  const pending = requestCopilot(
    "Hi",
    [],
    controller.signal,
    async (_, options) => {
      upstreamSignal = options?.signal as AbortSignal;
      return new Promise<Response>(() => {});
    },
  );
  controller.abort(new Error("New chat"));
  await assert.rejects(pending, /New chat/);
  assert.equal(upstreamSignal?.aborted, true);
});

test("store-data deadlines reject unresolved work and clear after success", async () => {
  await assert.rejects(
    withDeadline(() => new Promise(() => {}), 10, "Store timeout"),
    /Store timeout/,
  );
  assert.equal(await withDeadline(async () => 42, 10, "Timeout"), 42);
});
