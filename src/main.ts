import { InfraiImageClient } from "./infrai-image-client.ts";
import { screenAndPublish } from "./moderate-upload.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example");

const result = await screenAndPublish(new InfraiImageClient(key), {
  file: process.env.IMAGE_DATA ?? "",
  filename: process.env.IMAGE_FILENAME ?? "listing.jpg",
  caption: process.env.IMAGE_CAPTION ?? "Blue ceramic mug on a kitchen table",
  requestId: process.env.REQUEST_ID ?? "listing-demo-001"
});
console.log(JSON.stringify(result, null, 2));
