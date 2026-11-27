"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const private_expert_validation_1 = require("../src/validations/private-expert.validation");
const responseMock = () => {
    const response = { statusCode: 200, body: undefined };
    response.status = (code) => { response.statusCode = code; return response; };
    response.json = (body) => { response.body = body; return response; };
    return response;
};
(0, node_test_1.default)("private expert payload accepts and preserves a valid level", () => {
    const req = {
        body: {
            fullName: "Jane Doe",
            phoneNumber: "+2348012345678",
            email: "jane@example.com",
            typeOfExpert: "Electrician",
            level: "three",
        },
    };
    const res = responseMock();
    let nextCalled = false;
    (0, private_expert_validation_1.validateExpert)(req, res, () => { nextCalled = true; });
    strict_1.default.equal(nextCalled, true);
    strict_1.default.equal(req.body.level, "three");
});
(0, node_test_1.default)("private expert payload rejects an unsupported level", () => {
    const req = {
        body: {
            fullName: "Jane Doe",
            phoneNumber: "+2348012345678",
            email: "jane@example.com",
            level: "senior",
        },
    };
    const res = responseMock();
    (0, private_expert_validation_1.validateExpert)(req, res, () => strict_1.default.fail("next should not be called"));
    strict_1.default.equal(res.statusCode, 400);
    strict_1.default.match(res.body.errors.join(" "), /one, two, three, four/);
});
(0, node_test_1.default)("private expert multipart availability JSON is parsed before validation", () => {
    const req = {
        body: { availability: '[{"time":"10:00","date":"2026-12-01"}]' },
    };
    let nextCalled = false;
    (0, private_expert_validation_1.parsePrivateExpertPayload)(req, {}, () => { nextCalled = true; });
    strict_1.default.equal(nextCalled, true);
    strict_1.default.deepEqual(req.body.availability, [{ time: "10:00", date: "2026-12-01" }]);
});
