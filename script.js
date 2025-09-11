const csvInput = document.getElementById("csvInput");
const dropArea = document.getElementById("dropArea");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const uploadSection = document.getElementById("uploadSection");
const dataSection = document.getElementById("dataSection");
const fileNameEl = document.getElementById("fileName");
const resetBtn = document.getElementById("resetBtn");
const websiteColEl = document.getElementById("websiteCol");
const phoneColEl = document.getElementById("phoneCol");
const resultsEl = document.getElementById("results");
const phoneListEl = document.getElementById("phoneList");
const downloadBtn = document.getElementById("downloadBtn");

let headers = [];
let rows = [];
let fileName = "";

resetBtn.addEventListener("click", () => {
  headers = [];
  rows = [];
  fileName = "";
  uploadSection.classList.remove("hidden");
  dataSection.classList.add("hidden");
  websiteColEl.innerHTML = '<option value="">(No column — treat all as no website)</option>';
  phoneColEl.innerHTML = '<option value="">Select phone column</option>';
  resultsEl.classList.add("hidden");
  phoneListEl.innerHTML = '';
  errorEl.textContent = '';
});

function handleCsv(file) {
  if (!file) return;
  loadingEl.textContent = "Parsing CSV…";
  errorEl.textContent = "";
  
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
    complete: (res) => {
      rows = (res.data || []).filter(r => Object.keys(r).length > 0);
      if (!rows.length) {
        errorEl.textContent = "No rows found in the CSV.";
        loadingEl.textContent = "";
        return;
      }
      headers = Object.keys(rows[0]);
      fileName = file.name;
      fileNameEl.textContent = fileName;

      websiteColEl.innerHTML = '<option value="">(No column — treat all as no website)</option>' +
        headers.map(h => `<option value="${h}">${h}</option>`).join('');
      phoneColEl.innerHTML = '<option value="">Select phone column</option>' +
        headers.map(h => `<option value="${h}">${h}</option>`).join('');

      loadingEl.textContent = "";
      uploadSection.classList.add("hidden");
      dataSection.classList.remove("hidden");
    },
    error: (err) => {
      errorEl.textContent = "CSV parsing error. Try another file.";
      loadingEl.textContent = "";
      console.error(err);
    }
  });
}

csvInput.addEventListener("change", e => handleCsv(e.target.files[0]));
dropArea.addEventListener("dragover", e => e.preventDefault());
dropArea.addEventListener("drop", e => {
  e.preventDefault();
  handleCsv(e.dataTransfer.files[0]);
});

function updatePhones() {
  const websiteCol = websiteColEl.value;
  const phoneCol = phoneColEl.value;
  if (!phoneCol) {
    resultsEl.classList.add("hidden");
    phoneListEl.innerHTML = '';
    return;
  }

  const normalize = v => (typeof v === "string" ? v.trim() : v ?? "");

  const filteredPhones = Array.from(new Set(
    rows.filter(r => {
      if (!websiteCol) return true;
      const w = normalize(r[websiteCol]);
      return !w || w.toLowerCase() === 'not found' || /^\s*(n\/a|none|not\s*available|-)?\s*$/i.test(w);
    }).map(r => normalize(r[phoneCol])).filter(p => p && p.toLowerCase() !== 'n/a')
  ));

  phoneListEl.innerHTML = filteredPhones.slice(0,200).map(p => `<li>${p}</li>`).join('');
  resultsEl.classList.toggle("hidden", filteredPhones.length === 0);

  downloadBtn.onclick = () => {
    if (!filteredPhones.length) return;
    const csv = Papa.unparse({ fields: ["phone"], data: filteredPhones.map(p => [p]) });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = fileName ? fileName.replace(/\.csv$/i, "") : "phones";
    a.href = url;
    a.download = `${base}_no-website_phones.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };
}

websiteColEl.addEventListener("change", updatePhones);
phoneColEl.addEventListener("change", updatePhones);
