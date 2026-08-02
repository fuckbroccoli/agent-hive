export const DOWNLOAD_BODY_MAX_BYTES = 256;

export class DownloadRequestError extends Error {
  constructor(readonly code: "REQUEST_TOO_LARGE" | "INVALID_JSON") {
    super(code);
  }
}

export async function readSmallJson(request: Request): Promise<unknown> {
  const declaredHeader = request.headers.get("content-length");
  if (declaredHeader !== null) {
    const normalized = declaredHeader.trim();
    if (!/^\d+$/.test(normalized)) throw new DownloadRequestError("INVALID_JSON");
    const declared = Number(normalized);
    if (!Number.isSafeInteger(declared)) throw new DownloadRequestError("INVALID_JSON");
    if (declared > DOWNLOAD_BODY_MAX_BYTES) throw new DownloadRequestError("REQUEST_TOO_LARGE");
  }

  if (!request.body) throw new DownloadRequestError("INVALID_JSON");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > DOWNLOAD_BODY_MAX_BYTES) {
        try {
          await reader.cancel("Request body exceeded the download counter limit.");
        } catch {
          // The request is rejected even if the transport cannot be cancelled cleanly.
        }
        throw new DownloadRequestError("REQUEST_TOO_LARGE");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof DownloadRequestError) throw error;
    throw new DownloadRequestError("INVALID_JSON");
  }
}

interface RateWindow {
  count: number;
  startedAt: number;
}

export class EphemeralRateLimiter {
  private readonly windows = new Map<string, RateWindow>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 4_096,
  ) {}

  consume(key: string, now = Date.now()): boolean {
    const current = this.windows.get(key);
    if (!current || now - current.startedAt >= this.windowMs) {
      if (!current && this.windows.size >= this.maxKeys) this.prune(now);
      if (!current && this.windows.size >= this.maxKeys) return false;
      this.windows.set(key, { count: 1, startedAt: now });
      return true;
    }
    if (current.count >= this.limit) return false;
    current.count += 1;
    return true;
  }

  private prune(now: number) {
    for (const [key, window] of this.windows) {
      if (now - window.startedAt >= this.windowMs) this.windows.delete(key);
    }
  }
}
