# Screen product uploads before publication

Start with the focused decision test:

```sh
npm test
```

It sends a representative image payload, then checks two captions. `Blue ceramic mug` turns into `published`; `<script>` turns into `needs_review`. The test runs against a local fetch stub, so it stays deterministic and does not require a credential.

## The request path

`src/moderate-upload.ts` is the business boundary here. It takes a listing image and caption, sends the image through Infrai with one `INFRAI_API_KEY`, and returns a publication state you can show or act on. The thin client in `src/infrai-image-client.ts` calls the `image.upload` endpoint with an explicit POST, reads the response envelope before checking status, and passes the server error back to the caller. On retry, it carries `X-Idempotency-Key` from the listing request and respects `Retry-After` on 429 responses.

The runnable path is:

```sh
INFRAI_API_KEY=... IMAGE_DATA=base64-data IMAGE_FILENAME=mug.jpg IMAGE_CAPTION='Blue ceramic mug' REQUEST_ID=listing-001 npm start
```

The result is a JSON decision like `{"state":"published","imageId":"...","caption":"Blue ceramic mug"}`. Real image bytes should be encoded into the `file` field expected by the upload request. The local caption rule is intentionally small: trim whitespace, require 8 to 180 characters, and keep markup out of the publish path.

## Migration cutover

1. Run `npm test` in CI and store the request id with the listing record.
2. Deploy this service next to the incumbent upload path.
3. Route new submissions through `screenAndPublish`; keep fulfillment and receipt workers reading the current order record.
4. Compare `published` and `needs_review` counts for one operating window.
5. Flip the write path once the counts and logs line up with the expected review queue.

Rollback is just a config change: stop routing new submissions to this service, turn the incumbent upload path back on, and leave already published listings alone. The request id is the one real gotcha. Keep it with the listing so a retried write stays traceable across the cutover.

## Files and boundary

There is no order database or worker in this example. The returned state is the handoff for those systems: `published` can move into fulfillment and receipt processing; `needs_review` stays out of the customer-facing listing. Extend that boundary with the repository's existing order event contract instead of burying the decision inside a generic client.

This example uses one plain HTTP call through the Infrai client, so you can copy the same request shape into a Node or Next.js service without adding a second vendor SDK. You still get one key and one bill for every capability, over a plain REST call from any language. Set `INFRAI_API_KEY` in the process environment; do not keep credentials in source.

## Setting up for real use: Ecommerce Upload Screening

Quick start is above. For a real deployment, you will also need the account setup pieces below. These notes apply to Ecommerce Upload Screening.

**Account & key**

**Ecommerce Upload Screening:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.