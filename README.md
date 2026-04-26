# Sunrise Rescue — Receipt Form

A self-hosted donation / adoption-fee receipt generator for [Sunrise Rescue](https://sunriserescue.com).

**What it does:** Volunteer fills in a short form → server builds a branded PDF receipt → emails it to the donor and to `info@sunriserescue.com` → posts the record to the Sunrise Rescue admin system.

## Quick start

```bash
npm install
cp .env.example .env       # then edit .env with real SMTP + admin URL
npm start
# open http://localhost:3000
```

## What's in the box

| File / dir | Purpose |
|---|---|
| `public/index.html` | The form |
| `public/styles.css` | Sunrise Rescue branding |
| `public/app.js` | Client-side validation + submit |
| `server.js` | Express server, `/api/receipt/preview` and `/api/receipt/send` |
| `lib/buildReceiptPdf.js` | PDFKit-based receipt template |
| `tests/receipt.spec.js` | Playwright end-to-end tests |
| `playwright.config.js` | Playwright config |
| `sample/` | Sample PDF receipt to share with stakeholders |
| `PLAYWRIGHT-INSTRUCTIONS.md` | Walkthrough for Jenny |
| `.env.example` | Environment template |
| `receipts/` | Generated PDFs are saved here (gitignored) |
| `admin-log.jsonl` | Local fallback log when admin URL isn't set |

## Configuration (`.env`)

| Var | Description |
|---|---|
| `PORT` | Web port. Default `3000`. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | SMTP for outgoing receipts. Leave example.com to skip email. |
| `MAIL_FROM_NAME` / `MAIL_FROM_ADDRESS` | Visible "From" on the email. |
| `MAIL_BCC_RESCUE` | The address that gets a copy of every receipt. Default `info@sunriserescue.com`. |
| `ADMIN_POST_URL` | If set, every generated receipt is `POST`ed here as JSON. If blank, records go to `admin-log.jsonl`. |
| `ADMIN_POST_TOKEN` | Optional bearer token sent as `Authorization: Bearer …`. |
| `ORG_NAME`, `ORG_EIN`, `ORG_ADDRESS_LINE_1`, `ORG_ADDRESS_LINE_2`, `ORG_WEBSITE` | Branding shown on the PDF. |

## API

### `POST /api/receipt/preview`

Builds and streams back a PDF preview. No email, no admin push.

```json
{
  "donor_name": "Jane Doe",
  "donor_email": "jane@example.com",
  "amount": 100,
  "receipt_type": "Donation",
  "payment_method": "PayPal",
  "date_received": "2026-04-25"
}
```

→ Response: `application/pdf`

### `POST /api/receipt/send`

Same body as above, plus three booleans:

```json
{
  "send_to_donor": true,
  "send_to_rescue": true,
  "post_to_admin": true
}
```

→ Response:

```json
{
  "ok": true,
  "receipt_number": "SR-20260425-AB12",
  "pdf_url": "/receipts/SR-20260425-AB12.pdf",
  "email_donor": "jane@example.com",
  "email_rescue": "info@sunriserescue.com",
  "admin_posted": true
}
```

### Admin POST payload (what the rescue's admin system receives)

```json
{
  "receipt_number": "SR-20260425-AB12",
  "donor": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "address": "123 Main St, San Diego, CA"
  },
  "type": "Donation",
  "amount": 100,
  "currency": "USD",
  "date_received": "2026-04-25",
  "payment_method": "PayPal",
  "reference": "TXN-12345",
  "animal_name": "",
  "notes": "",
  "pdf_filename": "SR-20260425-AB12.pdf",
  "created_at": "2026-04-25T18:30:00.000Z"
}
```

## Tests

```bash
npm install
npx playwright install chromium
npx playwright test           # headless
npx playwright test --ui      # watch mode
```

See `PLAYWRIGHT-INSTRUCTIONS.md` for a friendly walkthrough.

## Deploy notes

This is a tiny single-process Node app (Express + PDFKit + Nodemailer). It can run on any host that runs Node 18+. For production:

- Reverse-proxy behind nginx / Caddy with TLS.
- Add basic auth on `/` so only Sunrise Rescue volunteers can fill it in.
- Persist `receipts/` on a real disk (not ephemeral container storage) so you keep a record of every PDF.

## License

Internal tool for Sunrise Rescue. All rights reserved by the rescue.
