import axios from 'axios';

export const generatePaystackPaymentLink = async (reference: string, amount: number, email: string) => {
  const response = await axios.post(
    'https://api.paystack.co/transaction/initialize',
    {
      reference,
      amount: amount * 100,
      email: email, 
    },
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );

  return response.data.data.authorization_url;
};

export const verifyPaystackPayment = async (reference: string) => {
  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );

  return response.data.data.status === 'success' ? 'success' : 'failed';
};
