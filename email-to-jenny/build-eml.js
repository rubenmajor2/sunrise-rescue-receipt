// build-eml.js
// Builds an RFC 822 .eml file you can open directly in Apple Mail / Outlook.
// The .eml will appear as a draft with the PDF + instructions attached and
// addressed to info@sunriserescue.com.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const samplePdf = fs.readFileSync(path.join(ROOT, 'sample', 'Sunrise-Rescue-sample-receipt.pdf'));
const instructions = fs.readFileSync(path.join(ROOT, 'PLAYWRIGHT-INSTRUCTIONS.md'));

const subject = 'Sunrise Rescue — receipt form + sample PDF + how-to-use guide';
const to = 'Jenny <info@sunriserescue.com>';
const from = 'Ruben <ruben@example.com>';   // recipient will rewrite when sending

const body = fs.readFileSync(path.join(__dirname, 'email-body.md'), 'utf8')
  // Strip the meta header at the top of email-body.md so it doesn't appear in the message body
  .replace(/^# Email draft for Jenny[\s\S]*?---\s*\n/, '')
  .trim();

const boundary = '----=_SunriseBoundary_' + Date.now();

function b64chunk(buf) {
  return buf.toString('base64').replace(/(.{76})/g, '$1\r\n');
}

const headers = [
  'From: ' + from,
  'To: ' + to,
  'Subject: ' + subject,
  'MIME-Version: 1.0',
  'Content-Type: multipart/mixed; boundary="' + boundary + '"',
  '',
].join('\r\n');

const partText =
  '--' + boundary + '\r\n' +
  'Content-Type: text/plain; charset=UTF-8\r\n' +
  'Content-Transfer-Encoding: 8bit\r\n' +
  '\r\n' +
  body + '\r\n';

const partPdf =
  '--' + boundary + '\r\n' +
  'Content-Type: application/pdf; name="Sunrise-Rescue-sample-receipt.pdf"\r\n' +
  'Content-Transfer-Encoding: base64\r\n' +
  'Content-Disposition: attachment; filename="Sunrise-Rescue-sample-receipt.pdf"\r\n' +
  '\r\n' +
  b64chunk(samplePdf) + '\r\n';

const partMd =
  '--' + boundary + '\r\n' +
  'Content-Type: text/markdown; name="PLAYWRIGHT-INSTRUCTIONS.md"\r\n' +
  'Content-Transfer-Encoding: base64\r\n' +
  'Content-Disposition: attachment; filename="PLAYWRIGHT-INSTRUCTIONS.md"\r\n' +
  '\r\n' +
  b64chunk(instructions) + '\r\n';

const close = '--' + boundary + '--\r\n';

const eml = headers + partText + partPdf + partMd + close;
const out = path.join(__dirname, 'jenny-sunriserescue.eml');
fs.writeFileSync(out, eml);
console.log('Wrote', out, '(', eml.length, 'bytes )');
console.log('Open with: open "' + out + '"');
