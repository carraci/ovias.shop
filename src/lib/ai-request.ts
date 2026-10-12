export class DeadlineError extends Error {}

/** Bounds the whole operation, including reading the response body. */
export async function withDeadline<T>(
  run: (signal: AbortSignal) => Promise<T>,
  milliseconds: number,
  message: string,
  parent?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel = () => {};
  const deadline = new Promise<never>((_, reject) => {
    const fail = (reason: unknown) => {
      controller.abort(reason);
      reject(reason);
    };
    cancel = () => fail(parent?.reason ?? new Error("Request cancelled."));
    if (parent?.aborted) cancel();
    else parent?.addEventListener("abort", cancel, { once: true });
    timer = setTimeout(() => fail(new DeadlineError(message)), milliseconds);
  });
  try {
    return await Promise.race([
      deadline,
      controller.signal.aborted ? deadline : run(controller.signal),
    ]);
  } finally {
    clearTimeout(timer);
    parent?.removeEventListener("abort", cancel);
  }
}

export function requestCopilot(
  question: string,
  messages: { role: "user" | "assistant"; content: string }[],
  signal: AbortSignal,
  fetcher: typeof fetch = fetch,
  timeout = 45000,
) {
  return withDeadline(
    async (requestSignal) => {
      const response = await fetcher("/api/admin/ai-copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, messages }),
        signal: requestSignal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success)
        throw new Error(
          data?.error || "Unable to get an answer. Please retry.",
        );
      if (typeof data.answer !== "string" || !data.answer.trim())
        throw new Error(
          "The assistant returned an empty answer. Please retry.",
        );
      return data.answer as string;
    },
    timeout,
    "The assistant took too long. Please retry.",
    signal,
  );
}
