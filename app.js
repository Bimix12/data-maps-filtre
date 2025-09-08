// app.js - copy exactly
const app = document.getElementById('app');
const fileInput = document.getElementById('fileInput');

app.innerHTML = `
  <h1>No-Website Phone Extractor</h1>
  <p class="lead">Upload a CSV exported from Google Maps (or similar). The tool extracts phone numbers for entries that don't have a website.</p>

  <div style="margin-top:12px;">
    <label for="fileInput" class="choose-btn">Choose CSV file</label>
  </div>

  <div id="output"></div>
`;

let rows = [];
let headers = [];
let websiteCol = '';
let phoneCol = '';
let filteredPhones = [];

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => (h||'').trim(),
    complete: (res) => {
      rows = (res.data || []).filter(r => Object.keys(r).length > 0);
      if (!rows.length) {
        alert('No rows found in CSV.');
        return;
      }
      headers = Object.keys(rows[0]);
      renderSelectors();
    },
    error: (err) => alert('CSV parse error: ' + (err.message || err))
  });
});

function renderSelectors() {
  const out = document.getElementById('output');
  const hdrOptions = headers.map(h => `<option value="${h}">${h}</option>`).join('');
  out.innerHTML = `
    <div class="controls">
      <label>Website column
        <select id="websiteSelect">
          <option value="">(No column — treat all as no website)</option>
          ${hdrOptions}
        </select>
      </label>

      <label>Phone column *
        <select id="phoneSelect">
          <option value="">Select phone column</option>
          ${hdrOptions}
        </select>
      </label>
    </div>

    <div class="actions">
      <button id="extractBtn" class="btn btn-extract">Extract Phones</button>
      <button id="downloadBtn" class="btn btn-download" disabled>Download Phones CSV</button>
      <button id="resetBtn" class="btn btn-reset">Reset</button>
    </div>

    <div id="stats" class="stats hidden">
      <span>Total rows: <b id="totalRows">0</b></span>
      <span>No-website rows: <b id="noWebsiteRows">0</b></span>
      <span>Phones extracted: <b id="phonesCount">0</b></span>
    </div>

    <div id="results" class="results hidden">
      <h2>Preview (first 200)</h2>
      <div class="table-container">
        <table id="resultsTable">
          <thead><tr><th>#</th><th>Name</th><th>Phone</th></tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('websiteSelect').addEventListener('change', (e)=> websiteCol = e.target.value);
  document.getElementById('phoneSelect').addEventListener('change', (e)=> phoneCol = e.target.value);
  document.getElementById('extractBtn').addEventListener('click', onExtract);
  document.getElementById('downloadBtn').addEventListener('click', onDownload);
  document.getElementById('resetBtn').addEventListener('click', resetAll);

  // auto-guess columns
  const lower = headers.map(h => h.toLowerCase());
  const websiteGuessIdx = lower.findIndex(h => ['website','web site','site','url','homepage','home page'].some(k => h.includes(k)));
  const phoneGuessIdx = lower.findIndex(h => ['phone','telephone','tel','mobile','cell','contact number'].some(k => h.includes(k)));
  if (websiteGuessIdx >= 0) document.getElementById('websiteSelect').value = headers[websiteGuessIdx];
  if (phoneGuessIdx >= 0) document.getElementById('phoneSelect').value = headers[phoneGuessIdx];
}

function onExtract() {
  if (!phoneCol) {
    alert('Please select a phone column first.');
    return;
  }
  const normalize = v => (typeof v === 'string' ? v.trim() : (v==null ? '' : String(v))).trim();

  const noWebsiteRows = rows.filter(r => {
    if (!websiteCol) return true;
    const w = normalize(r[websiteCol]);
    // consider empty or clearly not a URL as missing
    if (!w) return true;
    const wl = w.toLowerCase();
    // treat common placeholders as missing
    if (wl === 'not found' || wl === 'n/a' || wl === 'none' || wl === '-') return true;
    // if it contains http or a dot, consider it a website (present) => exclude
    if (/https?:\\/\\//i.test(w) || /\\./.test(w)) return false;
    return true;
  });

  // extract unique phones
  const phones = [];
  const previewRows = [];
  for (const r of noWebsiteRows) {
    const p = normalize(r[phoneCol]);
    if (p && !phones.includes(p)) {
      phones.push(p);
      // choose a name column to show (prefer 'name' or first column)
      const nameKey = Object.keys(r).find(k => /name/i.test(k)) || Object.keys(r)[0];
      previewRows.push({ name: r[nameKey] || '', phone: p });
    }
  }

  filteredPhones = phones;
  // update UI
  document.getElementById('totalRows').textContent = rows.length;
  document.getElementById('noWebsiteRows').textContent = noWebsiteRows.length;
  document.getElementById('phonesCount').textContent = filteredPhones.length;
  document.getElementById('stats').classList.remove('hidden');

  // fill preview table
  const tbody = document.querySelector('#resultsTable tbody');
  tbody.innerHTML = '';
  previewRows.slice(0,200).forEach((r,i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${escapeHtml(String(r.name||''))}</td><td>${escapeHtml(String(r.phone||''))}</td>`;
    tbody.appendChild(tr);
  });
  document.getElementById('results').classList.remove('hidden');
  document.getElementById('downloadBtn').disabled = filteredPhones.length === 0;
}

function onDownload() {
  if (!filteredPhones || !filteredPhones.length) return;
  const csv = Papa.unparse({ fields: ['phone'], data: filteredPhones.map(p => [p]) });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'phones_no_website.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resetAll() {
  rows = []; headers = []; websiteCol = ''; phoneCol = ''; filteredPhones = [];
  document.getElementById('output').innerHTML = '';
  document.getElementById('app').querySelector('.choose-btn').scrollIntoView({behavior:'smooth'});
  // re-create the choose button? it's still present as label for fileInput
  // clear file input
  try { document.getElementById('fileInput').value = ''; } catch(e) {}
  document.getElementById('stats')?.classList.add('hidden');
  document.getElementById('results')?.classList.add('hidden');
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',\"'\":\"&#39;\"})[m]; });
}
