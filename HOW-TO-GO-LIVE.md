# Going live for Jenny — 3 minutes, one click

The form is built. The repo is pushed to GitHub. We just need a real URL Jenny can hit.

## Fastest path: Render one-click deploy (free, ~3 min)

1. Click this link in your browser:

   👉 **https://render.com/deploy?repo=https://github.com/rubenmajor2/sunrise-rescue-receipt**

2. Sign in with GitHub (or whatever you have).
3. Render reads `render.yaml` from the repo, creates the free web service, and auto-generates the `ACCESS_TOKEN` env var.
4. Click **Apply / Deploy**. Wait ~3 min. The service shows a green dot and a URL like:

   `https://sunrise-rescue-receipt.onrender.com`

5. In the service → **Environment**, click the eye icon next to `ACCESS_TOKEN` and copy the value.

## Send Jenny the link

Once you have the URL and the token, run:

```bash
osascript /Users/rubenmajor/Desktop/sunrise-rescue-receipt/email-to-jenny/send-live-link.applescript \
  "https://sunrise-rescue-receipt.onrender.com" \
  "PASTE_THE_ACCESS_TOKEN_HERE"
```

That sends Jenny:
- the tokenized link `https://sunrise-rescue-receipt.onrender.com/?t=<TOKEN>`
- the updated sample PDF (with EIN 85-1162020)
- plain English on what info you still need from her (SMTP login + admin destination)

## Or paste it into Apple Mail manually

Open `email-to-jenny/send-live-link.applescript` and you'll see the body text. Copy/paste it into a new Mail message addressed to `info@sunriserescue.com`, replace the placeholder URL with the real Render URL + `?t=TOKEN`, attach `sample/Sunrise-Rescue-sample-receipt.pdf`, send.

## When Jenny replies with SMTP + admin destination

In Render → service → **Environment**, add:

- `SMTP_HOST`, `SMTP_PORT` (usually 465), `SMTP_SECURE=true`, `SMTP_USER=info@sunriserescue.com`, `SMTP_PASS=<app password>`
- `ADMIN_POST_URL`, `ADMIN_POST_TOKEN` (where receipt records should land)

Save → service auto-restarts in ~30 seconds → Jenny's already-bookmarked link now does the full thing.

## Alternative: don't want to use Render?

The repo is plain Node 18+. It runs on anything: fly.io, Railway, AWS App Runner, your own VPS, even WOPR if you want to cohost. Just set `ACCESS_TOKEN` to a long random string, expose port 10000, and point the domain. Token gating works the same everywhere.
