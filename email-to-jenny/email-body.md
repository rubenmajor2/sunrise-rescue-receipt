# Email draft for Jenny — Sunrise Rescue receipt form

**To:** info@sunriserescue.com
**Subject:** Sunrise Rescue — receipt form + sample PDF + how-to-use guide
**Attachments:**
- `Sunrise-Rescue-sample-receipt.pdf` (the sample receipt)
- `PLAYWRIGHT-INSTRUCTIONS.md` (the how-to-use guide)

---

Hi Jenny,

Wanted to send over the receipt tool I put together for Sunrise Rescue. Three things attached / linked here.

**1. Sample receipt PDF.** That's the attachment named `Sunrise-Rescue-sample-receipt.pdf`. It shows the layout and branding the donors and adopters will get when you run the form.

**2. The form itself.** It's a small web app you (or any volunteer) fills out for each donation or adoption fee. When you submit, it does three things automatically:

- builds the PDF receipt from what you typed in,
- emails it to the donor and CC's a copy to `info@sunriserescue.com` for your records,
- posts the same record to the Sunrise Rescue admin system so it shows up in the books.

There's also a "Preview PDF only" button so you can look at the receipt before anything is emailed or posted.

**3. How to use it.** I attached `PLAYWRIGHT-INSTRUCTIONS.md`. Section 2 is the only part most volunteers will ever read — it's the plain "how do I use the form" walkthrough. Section 3 onward is for whoever maintains the site, and it covers Playwright (a free tool from Microsoft for automatically testing web forms) so you can confirm the form still works end-to-end after any change without having to click through it by hand.

Quick start once you have the project files:

```
cd ~/Desktop/sunrise-rescue-receipt
npm install
npm start
```

Then open http://localhost:3000 and fill out the form. Receipts get saved as PDFs in the `receipts/` folder on the same machine, so you always have a local backup even if email or the admin system are down.

A couple of small things I'll need from you before this is fully live:

- The SMTP login Sunrise Rescue uses for `info@sunriserescue.com` (so the form can send the receipts through your account, not from a generic address).
- Your EIN, so I can put it on the PDF (helps donors with their tax records).
- The URL of the Sunrise Rescue admin system endpoint where receipt records should be posted. If you don't have one yet, the form will save the records to a local log file and we can wire up the admin push later — nothing breaks in the meantime.

Take a look at the sample PDF and let me know if anything about the layout, wording, or fields you want changed. Easy to adjust.

Thanks,
Ruben
