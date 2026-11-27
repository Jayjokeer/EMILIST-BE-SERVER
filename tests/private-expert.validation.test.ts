import assert from "node:assert/strict";
import test from "node:test";
import { parsePrivateExpertPayload, validateExpert } from "../src/validations/private-expert.validation";

const responseMock = () => {
  const response: any = { statusCode: 200, body: undefined };
  response.status = (code: number) => { response.statusCode = code; return response; };
  response.json = (body: unknown) => { response.body = body; return response; };
  return response;
};

test("private expert payload accepts and preserves a valid level", () => {
  const req: any = {
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
  validateExpert(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.body.level, "three");
});

test("private expert payload rejects an unsupported level", () => {
  const req: any = {
    body: {
      fullName: "Jane Doe",
      phoneNumber: "+2348012345678",
      email: "jane@example.com",
      level: "senior",
    },
  };
  const res = responseMock();
  validateExpert(req, res, () => assert.fail("next should not be called"));
  assert.equal(res.statusCode, 400);
  assert.match(res.body.errors.join(" "), /one, two, three, four/);
});

test("private expert multipart availability JSON is parsed before validation", () => {
  const req: any = {
    body: { availability: '[{"time":"10:00","date":"2026-12-01"}]' },
  };
  let nextCalled = false;
  parsePrivateExpertPayload(req, {} as any, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.deepEqual(req.body.availability, [{ time: "10:00", date: "2026-12-01" }]);
});
