# portfolio

Plain HTML/CSS/JS with no build step, plus two Vercel serverless functions for Razorpay payments (USD).

```
public/          everything visitors can load (the only folder that is served)
api/order.js     POST /api/order  – creates a Razorpay order; the server sets the price
api/verify.js    POST /api/verify – checks Razorpay's signature, then confirms the payment is captured
lib/razorpay.js  Razorpay REST client + request guard (same-origin JSON only, per-IP rate limit)
vercel.json      serves public/, adds security headers (CSP, no framing, nosniff, no-store on /api)
```

## Run locally
```
npm start
```
Reads keys from `.env` (see `.env.example`). The folder is linked to the `siddharth-suri` project on Vercel (live at https://siddharth-suri.vercel.app).

## Deploy
1. Import the repo into Vercel, or run `vercel --prod`.
2. In Project → Settings → Environment Variables, add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
3. In Project → Firewall, add a rate-limit rule for `/api/` as an account-wide backstop.
4. In the Razorpay dashboard, enable international payments so cards from outside India work.

`.env` is ignored by git (`.gitignore`) and never uploaded (`.vercelignore`).
