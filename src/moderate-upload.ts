import { InfraiImageClient } from "./infrai-image-client.ts";
import { z } from "zod";

export type UploadSubmission = { file: string; filename: string; caption: string; requestId: string };
export type PublishDecision = { state: "published" | "needs_review"; imageId: string; caption: string };

const uploadSubmission = z.object({
  file: z.string().min(1),
  filename: z.string().min(1),
  caption: z.string(),
  requestId: z.string().min(1)
});

function captionIsPublishable(caption: string): boolean {
  const normalized = caption.trim();
  return normalized.length >= 8 && normalized.length <= 180 && !/[<>]/.test(normalized);
}

export async function screenAndPublish(client: InfraiImageClient, input: UploadSubmission): Promise<PublishDecision> {
  const request = uploadSubmission.parse(input);
  const publishable = captionIsPublishable(request.caption);
  if (!publishable) {
    return {
      state: "needs_review",
      imageId: "",
      caption: request.caption.trim()
    };
  }

  const image = await client.upload(request.file, request.filename, request.requestId);
  return {
    state: "published",
    imageId: image.id,
    caption: request.caption.trim()
  };
}
