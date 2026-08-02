import assert from "node:assert/strict";
import test from "node:test";
import { DownloadRequestError, EphemeralRateLimiter, readSmallJson } from "../lib/download-guard";

test("reads a bounded JSON request", async () => {
  const request = new Request("https://hivebuzz.xyz/api/downloads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ releaseKey: "agent:agent.quiet-researcher@1.0.0" }),
  });
  assert.deepEqual(await readSmallJson(request), { releaseKey: "agent:agent.quiet-researcher@1.0.0" });
});

test("cancels a chunked request before buffering beyond the limit", async () => {
  let pulls = 0;
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1;
      controller.enqueue(new Uint8Array(pulls === 1 ? 200 : 100));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request("https://hivebuzz.xyz/api/downloads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: stream,
    duplex: "half",
  } as RequestInit & { duplex: "half" });

  await assert.rejects(
    readSmallJson(request),
    (error: unknown) => error instanceof DownloadRequestError && error.code === "REQUEST_TOO_LARGE",
  );
  assert.equal(pulls, 2);
  assert.equal(cancelled, true);
});

test("rejects an oversized declared body without reading it", async () => {
  const request = new Request("https://hivebuzz.xyz/api/downloads", {
    method: "POST",
    headers: { "content-length": "257", "content-type": "application/json" },
    body: "{}",
  });
  await assert.rejects(
    readSmallJson(request),
    (error: unknown) => error instanceof DownloadRequestError && error.code === "REQUEST_TOO_LARGE",
  );
});

test("bounds requests per ephemeral client window", () => {
  const limiter = new EphemeralRateLimiter(2, 1_000);
  assert.equal(limiter.consume("client", 0), true);
  assert.equal(limiter.consume("client", 1), true);
  assert.equal(limiter.consume("client", 2), false);
  assert.equal(limiter.consume("client", 1_000), true);
});
