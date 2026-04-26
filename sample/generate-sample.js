// Generate a sample PDF receipt to attach to the demo email to Jenny.
const fs = require('fs');
const path = require('path');
const { buildReceiptPdf } = require('../lib/buildReceiptPdf');

const ORG = {
  name: 'Sunrise Rescue',
  ein: '85-1162020',
  address1: '',
  address2: 'San Diego, CA',
  website: 'https://sunriserescue.com',
};

const sample = {
  receipt_number: 'SR-SAMPLE-0001',
  donor_name: 'Sample Donor',
  donor_email: 'donor@example.com',
  donor_address: '123 Main St, San Diego, CA 92101',
  receipt_type: 'Donation',
  amount: 150.00,
  date_received: new Date().toISOString().slice(0, 10),
  payment_method: 'PayPal',
  reference: 'TXN-987654321',
  animal_name: '',
  notes: 'Sample receipt — this is what donors and the rescue will receive.',
};

(async () => {
  const pdf = await buildReceiptPdf(sample, ORG);
  const out = path.join(__dirname, 'Sunrise-Rescue-sample-receipt.pdf');
  fs.writeFileSync(out, pdf);
  console.log('Wrote', out, '(', pdf.length, 'bytes )');
})();
