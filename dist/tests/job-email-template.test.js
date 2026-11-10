"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const templates_1 = require("../src/utils/templates");
(0, node_test_1.default)("job application emails never render undefined account fields", () => {
    const messages = [
        (0, templates_1.sendJobApplicationMessage)(undefined, undefined, undefined),
        (0, templates_1.directJobApplicationMessage)(undefined, undefined, undefined),
        (0, templates_1.acceptJobApplicationMessage)(undefined, undefined, undefined, undefined),
    ];
    for (const message of messages) {
        strict_1.default.doesNotMatch(message.html, /\b(?:undefined|null)\b/i);
    }
});
(0, node_test_1.default)("job application email escapes user-controlled names and titles", () => {
    const { html } = (0, templates_1.sendJobApplicationMessage)("Jane & Co", "<Applicant>", "Fix 'quoted' sink");
    strict_1.default.match(html, /Jane &amp; Co/);
    strict_1.default.match(html, /&lt;Applicant&gt;/);
    strict_1.default.match(html, /Fix &#039;quoted&#039; sink/);
});
