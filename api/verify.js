import { createHmac, timingSafeEqual } from "node:crypto";
import { keySecret, razorpay, readJson } from "../lib/razorpay.js";

const ORDER_ID = /^order_[A-Za-z0-9]{8,30}$/;
const PAYMENT_ID = /^pay_[A-Za-z0-9]{8,30}$/;
const SIGNATURE = /^[a-f0-9]{64}$/;
const matches = (pattern, value) => typeof value === "string" && pattern.test(value);

// Confirms a checkout result: the signature proves it came from Razorpay, then Razorpay
// itself is asked whether the money was captured (capturing it if only authorized).
export default async function handler(req, res) {
  const body = readJson(req, res);
  if (!body) return;

  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
  if (!matches(ORDER_ID, orderId) || !matches(PAYMENT_ID, paymentId) || !matches(SIGNATURE, signature)) {
    return res.status(400).json({ error: "Missing or malformed payment details." });
  }

  try {
    const expected = createHmac("sha256", keySecret()).update(`${orderId}|${paymentId}`).digest();
    if (!timingSafeEqual(Buffer.from(signature, "hex"), expected)) {
      return res.status(400).json({ error: "Invalid payment signature." });
    }

    let { status, amount, currency } = await razorpay(`/payments/${paymentId}`);
    if (status === "authorized") {
      // If auto-capture wins the race, the capture call fails; re-read the status instead.
      ({ status } = await razorpay(`/payments/${paymentId}/capture`, { amount, currency })
        .catch(() => razorpay(`/payments/${paymentId}`)));
    }
    if (status !== "captured") return res.status(402).json({ error: "Payment was not completed." });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not confirm the payment right now." });
  }
}
