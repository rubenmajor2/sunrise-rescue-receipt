# Sunrise Rescue Receipt Form — Playwright Walkthrough

This guide shows you how to use the **receipt form** end-to-end, and how to use **Playwright** (a free browser-automation tool from Microsoft) to test it without clicking through everything by hand. You can stop after section 2 if you only want to use the form. Sections 3+ are optional and are useful when you want to make sure everything still works after a change.

---

## 1. What this form does

When you fill it out and click **Generate & Send Receipt**, three things happen automatically:

1. A **PDF receipt** is built from the info you typed in.
2. The PDF is **emailed to the recipient** and **CC'd to `info@sunriserescue.com`** for the records.
3. The same data is **posted to the Sunrise Rescue admin system** so it shows up in the books.

You can also click **Preview PDF only** to see what the receipt will look like *before* anything is emailed or posted.

---

## 2. Using the form (the human way)

### 2.1 Start the form

Open Terminal and run:

```bash
cd ~/Desktop/sunrise-rescue-receipt
npm install        # only the first time
npm start
```

You'll see:

```
Sunrise Rescue receipt form running at http://localhost:3000
```

Open **http://localhost:3000** in your browser.

### 2.2 Fill it in

| Field | What to put |
|---|---|
| **Full name** | The recipient's name as it should appear on the receipt |
| **Email** | Where the receipt should be emailed |
| **Mailing address** | Optional, but nice to have for tax records |
| **Type** | Donation, Adoption Fee, Foster Reimbursement, Event/Merch, Other |
| **Amount (USD)** | Just the number, e.g. `150` or `25.50` |
| **Date received** | Defaults to today — change if needed |
| **Payment method** | PayPal, Credit/Debit, Cash, Check, Venmo, Zelle, In-kind, Other |
| **Reference / transaction #** | Optional. PayPal transaction ID, check #, etc. |
| **Animal name** | Only if it's an adoption fee (e.g. "Bernice") |
| **Notes** | Optional. Goes on the receipt — useful for "in memory of" or restricted donations |

Then check or uncheck:

- ☑ Email a copy to the recipient
- ☑ Email a copy to `info@sunriserescue.com`
- ☑ Post the record to the Sunrise Rescue admin system

All three are checked by default. Uncheck any you don't want.

### 2.3 Submit

- **Preview PDF only** — opens the PDF in a new tab. Nothing is sent.
- **Generate & Send Receipt** — does it for real. You'll see a green confirmation with the receipt number (e.g. `SR-20260425-AB12`).

That's it for daily use. You can stop here.

---

## 3. (Optional) Testing the form with Playwright

Playwright is a free tool that pretends to be a person clicking buttons. It's useful when:

- You changed something on the form and want to make sure nothing broke.
- You want a documented record that the form *works* end-to-end before going live.
- You want to take screenshots automatically.

### 3.1 One-time setup

```bash
cd ~/Desktop/sunrise-rescue-receipt
npm install
npx playwright install chromium     # downloads the test browser (~150MB)
```

### 3.2 Run the tests

```bash
npx playwright test
```

You'll see output like:

```
Running 4 tests using 1 worker
  ✓ loads the form and shows the brand header (1.2s)
  ✓ blocks submit when required fields are empty (0.4s)
  ✓ preview returns a PDF (0.9s)
  ✓ full submit generates a receipt number and admin record (1.1s)

  4 passed (4.7s)
```

If a test fails, Playwright saves a screenshot, the page HTML, and a video of what went wrong into `test-results/` so you can see exactly what broke.

### 3.3 Watch the tests run (visual mode)

If you want to *see* the browser fly through the form like a tiny robot:

```bash
npx playwright test --ui
```

That opens a Playwright control panel where you can hit ▶ on each test and watch it run.

### 3.4 Generate your own test by recording

Playwright can record your clicks and turn them into a test automatically.

```bash
npx playwright codegen http://localhost:3000
```

A browser opens. Click through the form like you normally would. Playwright watches and writes the test code into a side panel. When you're done, copy the code and paste it into a new file like `tests/my-test.spec.js`.

---

## 4. What the tests cover

The four built-in tests in `tests/receipt.spec.js` confirm:

1. **The form loads** with the Sunrise Rescue header.
2. **Empty submits get blocked** — you can't accidentally send an empty receipt.
3. **The PDF preview works** and actually returns a PDF (not a broken response).
4. **The full submit flow works** — the server returns a real receipt number like `SR-20260425-AB12` and the success banner shows up on screen.

If all four pass, the form is healthy.

---

## 5. Common questions

**Q: Where do the PDF receipts go?**
They're saved to `~/Desktop/sunrise-rescue-receipt/receipts/` so you always have a local copy.

**Q: I haven't set up the SMTP / admin URL yet — does the form still work?**
Yes. The PDF still gets generated and saved. The email step is skipped if SMTP isn't configured, and the admin POST is logged to `admin-log.jsonl` if no admin URL is set. You can wire those up later in `.env`.

**Q: Where do I configure the email server and admin endpoint?**
Copy `.env.example` to `.env` and fill in the values. See `README.md` for the full list.

**Q: The tests fail with "ECONNREFUSED" — what now?**
That means the form server isn't running. Either run `npm start` in another terminal first, or let Playwright start it for you (the included `playwright.config.js` already does that automatically).

**Q: Can I run this on the actual Sunrise Rescue website?**
Yes — point Playwright at the live URL by setting `BASE_URL` first:
```bash
BASE_URL=https://receipts.sunriserescue.com npx playwright test
```

---

## 6. If something breaks

- Check the form server is running (`npm start` in `~/Desktop/sunrise-rescue-receipt`).
- Open **http://localhost:3000** in your browser. If the form doesn't load, the server isn't running.
- If the form loads but submit fails, the red status banner will tell you why.
- For deeper debugging, check the terminal where `npm start` is running — errors print there.
- The Playwright HTML report (after running tests) opens with `npx playwright show-report` and shows screenshots of every failure.

That's everything. The form is yours.
