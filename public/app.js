(function () {
  const form = document.getElementById('receiptForm');
  const statusEl = document.getElementById('status');
  const submitBtn = document.getElementById('submitBtn');
  const previewBtn = document.getElementById('previewBtn');

  // Default the date to today
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('date_received').value = today;

  // Carry the access token along with every API call so the server lets us in.
  const tokenMeta = document.querySelector('meta[name="access-token"]');
  const TOKEN = tokenMeta ? tokenMeta.getAttribute('content') : '';
  function withToken(path) {
    if (!TOKEN) return path;
    return path + (path.includes('?') ? '&' : '?') + 't=' + encodeURIComponent(TOKEN);
  }


  function setStatus(kind, msg) {
    statusEl.className = 'status show ' + kind;
    statusEl.innerHTML = msg;
  }

  function formData() {
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.send_to_donor = document.getElementById('send_to_donor').checked;
    data.send_to_rescue = document.getElementById('send_to_rescue').checked;
    data.post_to_admin = document.getElementById('post_to_admin').checked;
    return data;
  }

  function validate(data) {
    if (!data.donor_name?.trim()) return 'Recipient name is required.';
    if (!data.donor_email?.trim()) return 'Recipient email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.donor_email)) return 'Recipient email looks invalid.';
    if (!data.amount || Number(data.amount) <= 0) return 'Amount must be greater than 0.';
    if (!data.date_received) return 'Date received is required.';
    return null;
  }

  previewBtn.addEventListener('click', async () => {
    const data = formData();
    const err = validate(data);
    if (err) { setStatus('err', err); return; }
    setStatus('busy', 'Generating PDF preview…');
    try {
      const res = await fetch(withToken('/api/receipt/preview'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setStatus('ok', 'Preview opened in a new tab.');
    } catch (e) {
      setStatus('err', 'Preview failed: ' + e.message);
    }
  });

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const data = formData();
    const err = validate(data);
    if (err) { setStatus('err', err); return; }

    submitBtn.disabled = true;
    setStatus('busy', 'Building PDF, sending email, and posting to admin…');

    try {
      const res = await fetch(withToken('/api/receipt/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const out = await res.json();
      if (!res.ok || !out.ok) throw new Error(out.error || ('HTTP ' + res.status));

      const lines = [];
      lines.push('<strong>Receipt #' + out.receipt_number + ' generated.</strong>');
      if (out.email_donor)  lines.push('✓ Emailed recipient: ' + out.email_donor);
      if (out.email_rescue) lines.push('✓ Copied to: ' + out.email_rescue);
      if (out.admin_posted) lines.push('✓ Posted to admin system.');
      else if (data.post_to_admin) lines.push('• Admin endpoint not configured — record logged to admin-log.jsonl');
      lines.push('<a href="' + out.pdf_url + '" target="_blank" rel="noopener">Open PDF</a>');
      setStatus('ok', lines.join('<br/>'));
      form.reset();
      document.getElementById('date_received').value = today;
    } catch (e) {
      setStatus('err', 'Something went wrong: ' + e.message);
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
