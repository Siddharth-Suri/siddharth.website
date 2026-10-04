import { keyId, razorpay, readJson } from "../lib/razorpay.js";

const MIN_DOLLARS = 1;
const MAX_DOLLARS = 1000;

// Creates the Razorpay order, so the amount is fixed on the server before checkout opens.
export default async function handler(req, res) {
  const body = readJson(req, res);
  if (!body) return;

  const dollars = body.amount;
  if (!Number.isInteger(dollars) || dollars < MIN_DOLLARS || dollars > MAX_DOLLARS) {
    return res.status(400).json({ error: `Enter a whole amount between $${MIN_DOLLARS} and $${MAX_DOLLARS}.` });
  }

  try {
    const order = await razorpay("/orders", { amount: dollars * 100, currency: "USD" });
    res.status(200).json({ id: order.id, amount: order.amount, currency: order.currency, key: keyId() });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not start the payment. Try again shortly." });
  }
}
