// Shared by the API routes: a tiny Razorpay REST client and a request guard.
const API = "https://api.razorpay.com/v1";

const credentials = () => {
  const { RAZORPAY_KEY_ID: id, RAZORPAY_KEY_SECRET: secret } = process.env;
  if (!id || !secret) throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.");
  return { id, secret };
};

export const keyId = () => credentials().id;
export const keySecret = () => credentials().secret;

// GET when no body is given, POST otherwise. Throws on any non-2xx reply.
export async function razorpay(path, body) {
  const { id, secret } = credentials();
  const res = await fetch(`${API}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Razorpay ${path} → ${res.status}: ${data.error?.description ?? "unknown error"}`);
  return data;
}

const fail = (res, status, error) => {
  res.status(status).json({ error });
  return null;
};

// Per-IP fixed window. Memory lives per warm function instance, so it blunts bursts from one
// client; a Vercel Firewall rate-limit rule is the account-wide backstop.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const hits = new Map();
const limited = (ip) => {
  const now = Date.now();
  const hit = hits.get(ip);
  if (!hit || now - hit.start > WINDOW_MS) {
    if (hits.size > 10_000) hits.clear();
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  return ++hit.count > MAX_REQUESTS;
};

// Accepts only same-origin JSON POSTs and returns the parsed body, or replies with an error and returns null.
export function readJson(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return fail(res, 405, "Method not allowed.");
  }

  // Vercel sets x-real-ip itself, so clients can't spoof it.
  if (limited(req.headers["x-real-ip"] ?? req.socket.remoteAddress)) {
    res.setHeader("Retry-After", String(WINDOW_MS / 1000));
    return fail(res, 429, "Too many requests. Please wait a minute and try again.");
  }

  const { origin, host } = req.headers;
  if (origin) {
    let originHost = null;
    try { originHost = new URL(origin).host; } catch {}
    if (originHost !== host) return fail(res, 403, "Cross-origin requests are not allowed.");
  }

  if (!req.headers["content-type"]?.startsWith("application/json")) return fail(res, 415, "Expected JSON.");

  let body;
  try { body = req.body; } catch { return fail(res, 400, "Invalid JSON."); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return fail(res, 400, "Invalid request body.");
  return body;
}
