// buildReceiptPdf.js
// Generates a Sunrise Rescue branded PDF receipt as a Buffer.
// Pure function: takes a `data` object + `org` config, returns Promise<Buffer>.

const PDFDocument = require('pdfkit');

function fmtUSD(n) {
  const v = Number(n || 0);
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function buildReceiptPdf(data, org) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'LETTER', margin: 54 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // --- Header band ---
      const sunDeep = '#d97706';
      const ink = '#2a1f17';
      const muted = '#7a6650';

      doc.rect(0, 0, doc.page.width, 84).fill(sunDeep);
      doc.fillColor('white').font('Helvetica-Bold').fontSize(22)
        .text(org.name, 54, 28);
      doc.font('Helvetica').fontSize(10)
        .text(org.website || '', 54, 56, { width: 400 });
      doc.font('Helvetica-Bold').fontSize(11)
        .text('OFFICIAL RECEIPT', 0, 32, { align: 'right', width: doc.page.width - 54 });
      doc.font('Helvetica').fontSize(9)
        .text('501(c)(3) non-profit', 0, 50, { align: 'right', width: doc.page.width - 54 });
      if (org.ein && !/replace/i.test(org.ein)) {
        doc.text('EIN: ' + org.ein, 0, 62, { align: 'right', width: doc.page.width - 54 });
      }

      doc.fillColor(ink);
      let y = 110;

      // --- Receipt header block ---
      doc.font('Helvetica-Bold').fontSize(14).text('Receipt #' + data.receipt_number, 54, y);
      doc.font('Helvetica').fontSize(10).fillColor(muted)
        .text('Issued ' + fmtDate(new Date().toISOString().slice(0,10)), 54, y + 18);
      doc.fillColor(ink);
      y += 44;

      // --- Recipient + organization side by side ---
      const colW = (doc.page.width - 54 * 2 - 24) / 2;
      const leftX = 54;
      const rightX = 54 + colW + 24;

      doc.font('Helvetica-Bold').fontSize(11).text('Received from', leftX, y);
      doc.font('Helvetica-Bold').fontSize(11).text('Issued by', rightX, y);
      doc.font('Helvetica').fontSize(11);
      doc.text(data.donor_name || '', leftX, y + 16, { width: colW });
      let ly = y + 32;
      if (data.donor_email)   { doc.text(data.donor_email,   leftX, ly, { width: colW }); ly += 14; }
      if (data.donor_address) { doc.text(data.donor_address, leftX, ly, { width: colW }); ly += 14; }

      doc.text(org.name || '', rightX, y + 16, { width: colW });
      let ry = y + 32;
      if (org.address1) { doc.text(org.address1, rightX, ry, { width: colW }); ry += 14; }
      if (org.address2) { doc.text(org.address2, rightX, ry, { width: colW }); ry += 14; }
      if (org.website)  { doc.text(org.website,  rightX, ry, { width: colW }); ry += 14; }

      y = Math.max(ly, ry) + 18;

      // --- Detail table ---
      doc.moveTo(54, y).lineTo(doc.page.width - 54, y).strokeColor('#e7d8c5').lineWidth(1).stroke();
      y += 10;

      doc.font('Helvetica-Bold').fontSize(10).fillColor(muted);
      doc.text('DESCRIPTION', 54, y);
      doc.text('DETAIL', 54 + 220, y);
      doc.text('AMOUNT', 0, y, { align: 'right', width: doc.page.width - 54 });
      y += 16;

      doc.font('Helvetica').fontSize(11).fillColor(ink);

      const rows = [];
      rows.push([data.receipt_type || 'Donation',
                 data.animal_name ? ('Animal: ' + data.animal_name) :
                 (data.reference ? ('Ref: ' + data.reference) : ''),
                 fmtUSD(data.amount)]);
      rows.push(['Payment method', data.payment_method || '', '']);
      rows.push(['Date received', fmtDate(data.date_received), '']);
      if (data.reference && data.animal_name) rows.push(['Reference', data.reference, '']);

      for (const [c1, c2, c3] of rows) {
        doc.text(c1, 54, y, { width: 200 });
        doc.text(c2, 54 + 220, y, { width: 220 });
        if (c3) doc.text(c3, 0, y, { align: 'right', width: doc.page.width - 54 });
        y += 18;
      }

      y += 6;
      doc.moveTo(54, y).lineTo(doc.page.width - 54, y).strokeColor('#e7d8c5').stroke();
      y += 14;

      // --- Total ---
      doc.font('Helvetica-Bold').fontSize(13);
      doc.text('TOTAL', 54, y);
      doc.text(fmtUSD(data.amount), 0, y, { align: 'right', width: doc.page.width - 54 });
      y += 28;

      // --- Notes ---
      if (data.notes) {
        doc.font('Helvetica-Bold').fontSize(11).text('Notes', 54, y);
        y += 16;
        doc.font('Helvetica').fontSize(11).text(String(data.notes), 54, y, {
          width: doc.page.width - 108,
        });
        y = doc.y + 12;
      }

      // --- 501(c)(3) statement ---
      const stmt =
        'Sunrise Rescue is a registered 501(c)(3) non-profit organization. ' +
        'No goods or services were provided in exchange for this contribution unless ' +
        'otherwise noted. Please retain this receipt for your tax records.';

      doc.font('Helvetica-Oblique').fontSize(9).fillColor(muted)
        .text(stmt, 54, y, { width: doc.page.width - 108, align: 'left' });
      y = doc.y + 18;

      // --- Signature line ---
      doc.font('Helvetica').fontSize(10).fillColor(ink);
      doc.moveTo(54, y + 28).lineTo(54 + 220, y + 28).strokeColor(ink).lineWidth(0.5).stroke();
      doc.text('Authorized signature, Sunrise Rescue', 54, y + 32);

      // --- Footer ---
      doc.fontSize(8).fillColor(muted).text(
        'Thank you for supporting Sunrise Rescue.',
        54, doc.page.height - 60,
        { align: 'center', width: doc.page.width - 108 }
      );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { buildReceiptPdf, fmtUSD, fmtDate };
