const fileInput = document.getElementById('fileInput');
const output = document.getElementById('output');

let rows = [];
let headers = [];
let websiteCol = '';
let phoneCol = '';

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (res) => {
      rows = res.data;
      headers = Object.keys(rows[0] || {});
      renderSelectors();
    }
  });
});

function renderSelectors() {
  output.innerHTML = `
    <div style="margin-top:16px;">
      <label>Website column: 
        <select id="websiteSelect">
          <option value="">(No column — treat all as no website)</option>
          ${headers.map(h => `<option value="${h}">${h}</option>`).join('')}
        </select>
      </label>
    </div>
    <div style="margin-top:10px;">
      <label>Phone column *: 
        <select id="phoneSelect">
          ${headers.map(h => `<option value="${h}">${h}</option>`).join('')}
        </select>
      </label>
    </div>
    <div id="results" style="margin-top:20px;"></div>
  `;
  document.getElementById('websiteSelect').addEventListener('change', (e) => {
    websiteCol = e.target.value;
    filterAndShow();
  });
  document.getElementById('phoneSelect').addEventListener('change', (e) => {
    phoneCol = e.target.value;
    filterAndShow();
  });
}

function filterAndShow() {
  if (!phoneCol) return;
  const normalize = (v) => typeof v === 'string' ? v.trim() : (v ?? '');
  const noWebsiteRows = rows.filter(r => {
    if (!websiteCol) return true;
    const w = normalize(r[websiteCol]);
    return !w || w.toLowerCase() === 'not found' || /^(n\\/a|none|not available|-)?$/i.test(w);
  });
  const phones = Array.from(new Set(noWebsiteRows.map(r => normalize(r[phoneCol])).filter(p => p)));
  renderResults(phones);
}

function renderResults(phones) {
  const results = document.getElementById('results');
  if (!phones.length) {
    results.innerHTML = '<p>No phone numbers found.</p>';
    return;
  }
  results.innerHTML = `
    <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
      <span>Unique phone numbers without website: <strong>${phones.length}</strong></span>
      <button id="downloadBtn">Download CSV</button>
    </div>
    <div class="table-container">
      <table>
        <thead><tr><th>#</th><th>Phone</th></tr></thead>
        <tbody>
          ${phones.map((p,i) => `<tr><td>${i+1}</td><td>${p}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('downloadBtn').addEventListener('click', () => {
    const csv = Papa.unparse({fields:['phone'], data: phones.map(p => [p])});
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phones_no_website.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}
