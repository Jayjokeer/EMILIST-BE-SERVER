import test from "node:test";
import assert from "node:assert/strict";
import {
  acceptJobApplicationMessage,
  directJobApplicationMessage,
  sendJobApplicationMessage,
} from "../src/utils/templates";

test("job application emails never render undefined account fields", () => {
  const messages = [
    sendJobApplicationMessage(undefined as any, undefined as any, undefined as any),
    directJobApplicationMessage(undefined as any, undefined as any, undefined as any),
    acceptJobApplicationMessage(undefined as any, undefined as any, undefined as any, undefined as any),
  ];

  for (const message of messages) {
    assert.doesNotMatch(message.html, /\b(?:undefined|null)\b/i);
  }
});

test("job application email escapes user-controlled names and titles", () => {
  const { html } = sendJobApplicationMessage("Jane & Co", "<Applicant>", "Fix 'quoted' sink");

  assert.match(html, /Jane &amp; Co/);
  assert.match(html, /&lt;Applicant&gt;/);
  assert.match(html, /Fix &#039;quoted&#039; sink/);
});
