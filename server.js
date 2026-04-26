// server.js
// Sunrise Rescue receipt service.
// - Serves the form (public/)
// - POST /api/receipt/preview  -> returns a PDF stream (no email)
// - POST /api/receipt/send     -> generates PDF, emails donor + rescue, posts to admin

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');
const { buildReceiptPdf, fmtUSD, fmtDate } = require('./lib/buildReceiptPdf');

const app = express();
app.use(express.json({ limit: '256kb' }));

const RECEIPTS_DIR = path.join(__dirname, 'receipts');
fs.mkdirSync(RECEIPTS_DIR, { recursive: true });

// --- Token gate ---
// If ACCESS_TOKEN is set in the env, the form, the static assets, and both API
// routes require ?t=<TOKEN> on the URL (the form passes it through automatically
// via a hidden meta tag). If ACCESS_TOKEN is unset, the app is wide open
// (useful for local dev only — production Render deploy always sets it).
const ACCESS_TOKEN = (process.env.ACCESS_TOKEN || '').trim();
function tokenOk(req) {
  if (!ACCESS_TOKEN) return true;
  const t = req.query.t || req.headers['x-access-token'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return t === ACCESS_TOKEN;
}

// Health check (no token required) so Render knows the service is up.
app.get('/healthz', (req, res) => res.type('text/plain').send('ok'));

// Token gate every other request
app.use((req, res, next) => {
  if (req.path === '/healthz') return next();
  if (tokenOk(req)) return next();
  res.status(401).type('text/html').send(
    '<!doctype html><html><head><title>Sunrise Rescue — access required</title>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<style>body{font:16px/1.5 -apple-system,sans-serif;max-width:520px;margin:80px auto;padding:0 20px;color:#2a1f17}h1{color:#d97706}</style>' +
    '</head><body><h1>🐾 Sunrise Rescue</h1>' +
    '<p>This receipt form requires an access link. Please use the tokenized URL Ruben emailed you ' +
    '(it looks like <code>?t=…</code> at the end). If you lost it, reply to that email and he will resend.</p></body></html>'
  );
});

// Inject the token into the served HTML so the form's fetch() calls carry it
app.get(['/', '/index.html'], (req, res, next) => {
  const file = path.join(__dirname, 'public', 'index.html');
  fs.readFile(file, 'utf8', (err, html) => {
    if (err) return next(err);
    const t = req.query.t || '';
    const injected = html.replace(
      '</head>',
      '  <meta name="access-token" content="' + t.replace(/"/g, '&quot;') + '" />\n</head>'
    );
    res.type('text/html').send(injected);
  });
});

app.use(express.static(path.join(__dirname, 'public')));

const ORG = {
  name: process.env.ORG_NAME || 'Sunrise Rescue',
  ein: process.env.ORG_EIN || '',
  address1: process.env.ORG_ADDRESS_LINE_1 || '',
  address2: process.env.ORG_ADDRESS_LINE_2 || '',
  website: process.env.ORG_WEBSITE || 'https://sunriserescue.com',
};

// --- Helpers ---
function nextReceiptNumber() {
  // SR-YYYY-#### where #### is a daily-incrementing pad
  const today = new Date();
  const ymd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `SR-${ymd}-${rand}`;
}

function makeTransport() {
  if (!process.env.SMTP_HOST || /example\.com$/i.test(process.env.SMTP_HOST)) {
    return null; // not configured
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: String(process.env.SMTP_SECURE || 'true') === 'true',
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
}

async function postToAdmin(record) {
  const url = (process.env.ADMIN_POST_URL || '').trim();
  if (!url) {
    fs.appendFileSync(
      path.join(__dirname, 'admin-log.jsonl'),
      JSON.stringify({ at: new Date().toISOString(), record }) + '\n'
    );
    return { ok: true, mode: 'logged' };
  }
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.ADMIN_POST_TOKEN) {
    headers['Authorization'] = 'Bearer ' + process.env.ADMIN_POST_TOKEN;
  }
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Admin POST failed (${res.status}): ${text.slice(0, 240)}`);
  }
  return { ok: true, mode: 'posted' };
}

function sanitize(data) {
  const out = {};
  for (const k of [
    'donor_name','donor_email','donor_address','receipt_type','amount',
    'date_received','payment_method','reference','animal_name','notes'
  ]) {
    out[k] = (data[k] ?? '').toString().slice(0, 1000);
  }
  out.amount = Number(out.amount || 0);
  out.send_to_donor = !!data.send_to_donor;
  out.send_to_rescue = !!data.send_to_rescue;
  out.post_to_admin = !!data.post_to_admin;
  return out;
}

// --- Routes ---
app.post('/api/receipt/preview', async (req, res) => {
  try {
    const data = sanitize(req.body || {});
    data.receipt_number = 'PREVIEW-' + Date.now().toString(36).toUpperCase();
    const pdf = await buildReceiptPdf(data, ORG);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="receipt-preview.pdf"`);
    res.send(pdf);
  } catch (e) {
    res.status(500).type('text/plain').send('Preview error: ' + e.message);
  }
});

app.post('/api/receipt/send', async (req, res) => {
  try {
    const data = sanitize(req.body || {});
    data.receipt_number = nextReceiptNumber();

    // 1. Build PDF
    const pdf = await buildReceiptPdf(data, ORG);
    const pdfFile = path.join(RECEIPTS_DIR, `${data.receipt_number}.pdf`);
    fs.writeFileSync(pdfFile, pdf);

    // 2. Email
    const transport = makeTransport();
    let email_donor = null;
    let email_rescue = null;

    if (transport) {
      const fromName = process.env.MAIL_FROM_NAME || ORG.name;
      const fromAddr = process.env.MAIL_FROM_ADDRESS || 'info@sunriserescue.com';
      const from = `"${fromName}" <${fromAddr}>`;
      const subject = `Your Sunrise Rescue receipt (${data.receipt_number})`;
      const text =
`Hi ${data.donor_name || 'there'},

Thank you for supporting Sunrise Rescue. Your official receipt is attached.

Summary
  Receipt #:   ${data.receipt_number}
  Type:        ${data.receipt_type}
  Amount:      ${fmtUSD(data.amount)}
  Date:        ${fmtDate(data.date_received)}
  Payment:     ${data.payment_method}${data.reference ? ' (Ref: ' + data.reference + ')' : ''}
${data.animal_name ? '  Animal:      ' + data.animal_name + '\n' : ''}
Sunrise Rescue is a registered 501(c)(3) non-profit. Keep this receipt for your tax records.

With gratitude,
${ORG.name}
${ORG.website}`;

      const attachments = [{
        filename: `${data.receipt_number}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      }];

      if (data.send_to_donor && data.donor_email) {
        const bcc = data.send_to_rescue ? (process.env.MAIL_BCC_RESCUE || 'info@sunriserescue.com') : undefined;
        await transport.sendMail({
          from, to: data.donor_email, bcc, subject, text, attachments,
        });
        email_donor = data.donor_email;
        if (bcc) email_rescue = bcc;
      } else if (data.send_to_rescue) {
        // Donor opted out, but we still want a copy for the rescue records
        const to = process.env.MAIL_BCC_RESCUE || 'info@sunriserescue.com';
        await transport.sendMail({
          from, to, subject: '[records] ' + subject, text, attachments,
        });
        email_rescue = to;
      }
    }

    // 3. Admin POST
    let admin_posted = false;
    if (data.post_to_admin) {
      const r = await postToAdmin({
        receipt_number: data.receipt_number,
        donor: {
          name: data.donor_name,
          email: data.donor_email,
          address: data.donor_address,
        },
        type: data.receipt_type,
        amount: data.amount,
        currency: 'USD',
        date_received: data.date_received,
        payment_method: data.payment_method,
        reference: data.reference,
        animal_name: data.animal_name,
        notes: data.notes,
        pdf_filename: path.basename(pdfFile),
        created_at: new Date().toISOString(),
      });
      admin_posted = r.mode === 'posted';
    }

    res.json({
      ok: true,
      receipt_number: data.receipt_number,
      pdf_url: '/receipts/' + path.basename(pdfFile),
      email_donor,
      email_rescue,
      admin_posted,
    });
  } catch (e) {
    console.error('send error', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Serve generated PDFs
app.use('/receipts', express.static(RECEIPTS_DIR));

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Sunrise Rescue receipt form running at http://localhost:${PORT}`);
});
