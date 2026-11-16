import test from "node:test";
import assert from "node:assert/strict";
import { applySupportImageAttachments } from "../src/utils/image-upload";

test("support image middleware stores uploaded Cloudinary paths as attachments", () => {
  const req: any = {
    body: { message: "Evidence attached" },
    files: [
      { path: "https://res.cloudinary.com/emilist/image/upload/photo-1.jpg" },
      { path: "https://res.cloudinary.com/emilist/image/upload/photo-2.png" },
    ],
  };
  let nextCalled = false;

  applySupportImageAttachments(req, {} as any, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.body.attachments, [
    "https://res.cloudinary.com/emilist/image/upload/photo-1.jpg",
    "https://res.cloudinary.com/emilist/image/upload/photo-2.png",
  ]);
});

test("support image middleware rejects attachment links sent as text", () => {
  const req: any = { body: { attachments: "https://example.com/evidence.jpg" }, files: [] };
  let statusCode = 0;
  let responseBody: any;
  const res: any = {
    status(code: number) { statusCode = code; return this; },
    json(body: any) { responseBody = body; return this; },
  };

  applySupportImageAttachments(req, res, () => assert.fail("next should not be called"));

  assert.equal(statusCode, 400);
  assert.match(responseBody.message, /uploaded image files/);
});
