import axios from 'axios';
import crypto from "crypto";
import { config } from './config';

export const generatePaystackPaymentLink = async (reference: string, amount: number, email: string, redirectUrl?: string) => {
  const payload: any = {
    reference,
    amount: amount * 100,
    email: email,
  };

  if (redirectUrl) {
    payload.callback_url = redirectUrl;
    payload.cancel_url = redirectUrl;
  }

  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    payload,
    { headers: { Authorization: `Bearer ${config.paystackSecretKey}` } }
  );

  return response.data.data.authorization_url;
};

export const verifyPaystackPayment = async (reference: string) => {
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${config.paystackSecretKey}` } }
  );

  return response.data.data.status === 'success' ? 'success' : 'failed';
};

// Paystack signs every webhook with HMAC-SHA512 of the raw request body using
// the secret key. The raw Buffer body (not the parsed JSON) must be used.
export const verifyPaystackWebhookSignature = (rawBody: Buffer, signature: string) => {
  if (!config.paystackSecretKey || !rawBody || !signature) return false;
  const hash = crypto.createHmac("sha512", config.paystackSecretKey).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
};

export const resolveBankAccount = async (accountNumber: string, bankCode: string) => {
  const response = await axios.get(
    `https://api.paystack.co/bank/resolve`,
    {
      params: { account_number: accountNumber, bank_code: bankCode },
      headers: { Authorization: `Bearer ${config.paystackSecretKey}` },
    }
  );
  return {
    accountName: response.data.data.account_name,
    accountNumber: response.data.data.account_number,
  };
};

export const fetchBanks = async (currency = "NGN") => {
  const response = await axios.get(`https://api.paystack.co/bank`, {
    params: { currency, perPage: 100 },
    headers: { Authorization: `Bearer ${config.paystackSecretKey}` },
  });
  return response.data.data; // [{ name, code, ... }]
};

export const createTransferRecipient = async (name: string, accountNumber: string, bankCode: string, currency = "NGN") => {
  const response = await axios.post(
    `https://api.paystack.co/transferrecipient`,
    {
      type: "nuban",
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency,
    },
    { headers: { Authorization: `Bearer ${config.paystackSecretKey}` } }
  );
  return response.data.data.recipient_code;
};

export const initiateTransfer = async (amount: number, recipientCode: string, reference: string, reason?: string) => {
  const response = await axios.post(
    `https://api.paystack.co/transfer`,
    {
      source: "balance",
      amount: Math.round(amount * 100),
      recipient: recipientCode,
      reference,
      reason,
      currency: "NGN",
    },
    { headers: { Authorization: `Bearer ${config.paystackSecretKey}` } }
  );
  return response.data.data; // { transfer_code, status, ... }
};