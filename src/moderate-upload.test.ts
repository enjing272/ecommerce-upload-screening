import assert from "node:assert/strict";
import { InfraiImageClient } from "./infrai-image-client.ts";
import { screenAndPublish } from "./moderate-upload.ts";

const fetcher: typeof fetch = async (_input, init) => {
  assert.equal(init?.method, "POST");
  assert.match(String(init?.headers && (init.headers as Record<string, string>).Authorization), /^Bearer /);
  assert.deepEqual(JSON.parse(String(init?.body)), { file: "base64-data", filename: "mug.jpg" });
  return new Response(JSON.stringify({ ok: true, data: { id: "image-123" }, metadata: {} }), { status: 200 });
};

const client = new InfraiImageClient("test-key", fetcher);
const published = await screenAndPublish(client, { file: "base64-data", filename: "mug.jpg", caption: "Blue ceramic mug", requestId: "order-1" });
assert.deepEqual(published, { state: "published", imageId: "image-123", caption: "Blue ceramic mug" });

const review = await screenAndPublish(client, { file: "base64-data", filename: "mug.jpg", caption: "<script>", requestId: "order-2" });
assert.deepEqual(review, { state: "needs_review", imageId: "", caption: "<script>" });
console.log("screening decisions passed");
