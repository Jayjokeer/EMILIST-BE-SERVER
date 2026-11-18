import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticator } from 'otplib';
import { hashPassword } from '../src/utils/hashing';
import { createPasswordResetToken, hashInvitationToken } from '../src/services/admin.service';
import {
  assertPasswordNotReused,
  assertStrongAdminPassword,
  createAuthenticatorEnrollment,
  decryptMfaSecret,
  encryptMfaSecret,
  verifyAuthenticatorCode,
} from '../src/services/admin-onboarding.service';
import { buildFrontendUrl } from '../src/utils/frontend-url';

test('admin passwords must satisfy every rule shown by onboarding', () => {
  assert.throws(() => assertStrongAdminPassword('short'), /at least 12 characters/);
  assert.throws(() => assertStrongAdminPassword('alllowercase1!'), /mixed case/);
  assert.throws(() => assertStrongAdminPassword('NoNumberHere!'), /a number/);
  assert.throws(() => assertStrongAdminPassword('NoSymbolHere1'), /a symbol/);
  assert.throws(() => assertStrongAdminPassword('StrongPassword1!', 'DifferentPassword1!'), /do not match/);
  assert.doesNotThrow(() => assertStrongAdminPassword('StrongPassword1!', 'StrongPassword1!'));
});

test('a recent admin password cannot be reused', async () => {
  const recent = await hashPassword('StrongPassword1!');
  await assert.rejects(
    assertPasswordNotReused('StrongPassword1!', undefined, [recent]),
    /cannot re-use a recent password/,
  );
  await assert.doesNotReject(assertPasswordNotReused('DifferentPassword2!', undefined, [recent]));
});

test('authenticator enrollment returns a reusable secret and Emilist URI', () => {
  const first = createAuthenticatorEnrollment('jane@emilist.com');
  const resumed = createAuthenticatorEnrollment('jane@emilist.com', first.secret);

  assert.equal(resumed.secret, first.secret);
  assert.match(resumed.otpauthUri, /^otpauth:\/\/totp\/Emilist%20Admin:/);
  assert.match(resumed.otpauthUri, /jane%40emilist.com/);
});

test('authenticator verification accepts the current six-digit code', () => {
  const enrollment = createAuthenticatorEnrollment('jane@emilist.com');
  const code = authenticator.generate(enrollment.secret);
  assert.equal(verifyAuthenticatorCode(enrollment.secret, code), true);
  assert.equal(verifyAuthenticatorCode(enrollment.secret, '000000') || code === '000000', code === '000000');
});

test('MFA secrets are encrypted at rest and can be decrypted for verification', () => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'test-only-jwt-secret';
  try {
    const encrypted = encryptMfaSecret('TOPSECRET');
    assert.notEqual(encrypted, 'TOPSECRET');
    assert.match(encrypted, /^v1:/);
    assert.equal(decryptMfaSecret(encrypted), 'TOPSECRET');
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});

test('password reset links store only a deterministic hash of an opaque token', () => {
  const reset = createPasswordResetToken();
  assert.notEqual(reset.token, reset.tokenHash);
  assert.equal(hashInvitationToken(reset.token), reset.tokenHash);
  assert.equal(reset.tokenHash.length, 64);
});

test('admin invitation links use the configured frontend and safely encode the token', () => {
  assert.equal(
    buildFrontendUrl('https://emilist-admin-v2-l28s.vercel.app/login', {
      path: '/accept-invite',
      replacePath: true,
      query: {
        token: 'token with + and /',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Support Agent',
        invitedBy: 'Super Admin',
      },
    }),
    'https://emilist-admin-v2-l28s.vercel.app/accept-invite?token=token+with+%2B+and+%2F&fullName=Jane+Doe&email=jane%40example.com&role=Support+Agent&invitedBy=Super+Admin',
  );
});

test('frontend links preserve existing queries and append the requested path', () => {
  assert.equal(
    buildFrontendUrl('https://emilist-v2.vercel.app/admin?source=email', {
      path: '/reset-password',
      query: { token: 'abc' },
    }),
    'https://emilist-v2.vercel.app/admin/reset-password?source=email&token=abc',
  );
});

test('frontend link generation rejects missing or unsafe configuration', () => {
  assert.throws(() => buildFrontendUrl(undefined), /FRONTEND_ADMIN_URL/);
  assert.throws(() => buildFrontendUrl('javascript:alert(1)'), /must use http or https/);
});
