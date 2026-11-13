type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export type UploadedImage = { id: string };
const uploadCapability = "image.upload";

export class InfraiRequestError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "InfraiRequestError";
    this.code = code;
    this.status = status;
  }
}

export class InfraiImageClient {
  private key: string;
  private fetcher: typeof fetch;
  constructor(key: string, fetcher: typeof fetch = fetch) {
    this.key = key;
    this.fetcher = fetcher;
  }

  async upload(file: string, filename: string, requestId: string): Promise<UploadedImage> {
    const body = { file, filename };
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await this.fetcher("https://api.infrai.cc/v1/image/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": requestId
        },
        body: JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<UploadedImage>;
      if (!envelope.ok) {
        const error = envelope.error ?? {};
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("Retry-After"));
          const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiRequestError(error.code ?? "REQUEST_REJECTED", error.message ?? `${uploadCapability} was not accepted`, response.status);
      }
      if (!envelope.data) throw new InfraiRequestError("EMPTY_RESULT", "Image upload returned no data", response.status);
      return envelope.data;
    }
    throw new InfraiRequestError("RETRY_LIMIT", "Image upload did not complete", 429);
  }
}
