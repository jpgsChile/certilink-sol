export type RetryOptions = {
  label: string;
  maxAttempts?: number;
  initialBackoffMs?: number;
  maxBackoffMs?: number;
  retryable?: (err: unknown) => boolean;
  onRetry?: (ctx: { attempt: number; maxAttempts: number; error: unknown; delayMs: number }) => void;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withOperationalRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const initialBackoffMs = options.initialBackoffMs ?? 600;
  const maxBackoffMs = options.maxBackoffMs ?? 4000;
  const retryable = options.retryable ?? (() => true);

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const canRetry = attempt < maxAttempts && retryable(err);
      if (!canRetry) break;
      const delayMs = Math.min(maxBackoffMs, initialBackoffMs * attempt);
      options.onRetry?.({ attempt, maxAttempts, error: err, delayMs });
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${options.label}: error desconocido`);
}
