# Deploying to Render (one-click, free)

Render hosts the form at a public URL like `https://sunrise-rescue-receipt.onrender.com`. Jenny gets a tokenized link `https://…/?t=ABC123` and that's it — no install, no terminal.

## 1. Push the repo to GitHub (once)

```bash
cd ~/Desktop/sunrise-rescue-receipt
git init -q
git add .
git commit -m "Initial commit: Sunrise Rescue receipt form"
gh repo create sunrise-rescue-receipt --private --source=. --remote=origin --push
```

## 2. Deploy on Render

Option A — one click:
1. Go to https://render.com/dashboard → **New +** → **Blueprint**.
2. Connect the GitHub repo `sunrise-rescue-receipt`.
3. Render reads `render.yaml`, creates the free web service, and auto-generates `ACCESS_TOKEN`.
4. Click **Apply**. First deploy takes ~3 minutes.

Option B — manual:
1. **New +** → **Web Service** → connect repo.
2. Build command: `npm ci --omit=dev`
3. Start command: `node server.js`
4. Plan: Free.
5. Add the env vars from `render.yaml` by hand.

## 3. Get the tokenized URL for Jenny

After the deploy is green, go to the service → **Environment** → copy `ACCESS_TOKEN`. The link to send Jenny is:

```
https://sunrise-rescue-receipt.onrender.com/?t=<ACCESS_TOKEN>
```

That single URL is everything she needs. Bookmark it.

## 4. Wire up email + admin sync (when Jenny replies)

In the Render dashboard → service → **Environment** → add:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` — for sending receipts from `info@sunriserescue.com`.
- `ADMIN_POST_URL`, `ADMIN_POST_TOKEN` — where receipt records should be sent (donor DB, Google Sheet via Apps Script, Zapier, Make, QuickBooks, custom).

Render automatically restarts the service when you save env vars.

## 5. Free-tier note

Render's free plan spins the service down after ~15 min of inactivity. The first request after that takes ~30 seconds to wake up. For a low-volume tool like this it's fine; if it bothers you, the Starter plan is $7/mo and stays warm.

## 6. Custom domain (optional)

Point `receipts.sunriserescue.com` at the Render service:
- In Render → service → **Settings** → **Custom Domains** → add `receipts.sunriserescue.com`.
- In your DNS, add a CNAME pointing to the `.onrender.com` host Render shows you.

Then Jenny's link becomes `https://receipts.sunriserescue.com/?t=<TOKEN>`.

## Rotating the token

If the link ever leaks, regenerate `ACCESS_TOKEN` in Render → service → **Environment**. Old links stop working immediately. Send Jenny the new URL.
