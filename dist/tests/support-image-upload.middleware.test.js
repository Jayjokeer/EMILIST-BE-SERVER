"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const image_upload_1 = require("../src/utils/image-upload");
(0, node_test_1.default)("support image middleware stores uploaded Cloudinary paths as attachments", () => {
    const req = {
        body: { message: "Evidence attached" },
        files: [
            { path: "https://res.cloudinary.com/emilist/image/upload/photo-1.jpg" },
            { path: "https://res.cloudinary.com/emilist/image/upload/photo-2.png" },
        ],
    };
    let nextCalled = false;
    (0, image_upload_1.applySupportImageAttachments)(req, {}, () => { nextCalled = true; });
    strict_1.default.equal(nextCalled, true);
    strict_1.default.deepEqual(req.body.attachments, [
        "https://res.cloudinary.com/emilist/image/upload/photo-1.jpg",
        "https://res.cloudinary.com/emilist/image/upload/photo-2.png",
    ]);
});
(0, node_test_1.default)("support image middleware rejects attachment links sent as text", () => {
    const req = { body: { attachments: "https://example.com/evidence.jpg" }, files: [] };
    let statusCode = 0;
    let responseBody;
    const res = {
        status(code) { statusCode = code; return this; },
        json(body) { responseBody = body; return this; },
    };
    (0, image_upload_1.applySupportImageAttachments)(req, res, () => strict_1.default.fail("next should not be called"));
    strict_1.default.equal(statusCode, 400);
    strict_1.default.match(responseBody.message, /uploaded image files/);
});
(0, node_test_1.default)("order delivery middleware maps the uploaded proof image", () => {
    const req = {
        body: { status: "delivered" },
        file: { path: "https://res.cloudinary.com/emilist/image/upload/delivery.jpg" },
    };
    let nextCalled = false;
    (0, image_upload_1.applyOrderDeliveryImage)(req, {}, () => { nextCalled = true; });
    strict_1.default.equal(nextCalled, true);
    strict_1.default.equal(req.body.deliveryImage, "https://res.cloudinary.com/emilist/image/upload/delivery.jpg");
});
(0, node_test_1.default)("order delivery middleware rejects proof image links", () => {
    const req = { body: { status: "delivered", deliveryImage: "https://example.com/proof.jpg" } };
    let statusCode = 0;
    let responseBody;
    const res = {
        status(code) { statusCode = code; return this; },
        json(body) { responseBody = body; return this; },
    };
    (0, image_upload_1.applyOrderDeliveryImage)(req, res, () => strict_1.default.fail("next should not be called"));
    strict_1.default.equal(statusCode, 400);
    strict_1.default.match(responseBody.message, /uploaded image file/);
});
