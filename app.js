let rows = [];
let headers = [];
let websiteCol = "";
let phoneCol = [];
let phonesFiltered = [];

const fileInput = document.getElementById("csvInput");
const websiteSelect = document.getElementById("websiteCol");
const phoneSelect = document.getElementById("phoneCol");
const downloadBtn = document.getElementById("downloadBtn");
const outputDiv = document.getElementById("output");

// Parse CSV
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (res) => {
      rows = res.data;
      headers = Object.keys(rows[0] || {});
      fillSelects();
    },
    error: (err) => {
      alert("Error parsing CSV: " + err.message);
    },
  });
});

function fillSelects() {
  websiteSelect.innerHTML = `<option value="">(No column — treat all as no website)</option>`;
  phoneSelect.innerHTML = `<option value="">Select phone column</option>`;

  headers.forEach((h) => {
    const opt1 = document.createElement("option");
    opt1.value = h;
    opt1.textContent = h;
    websiteSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = h;
    opt2.textContent = h;
    phoneSelect.appendChild(opt2);
  });
}

websiteSelect.addEventListener("change", (e) => {
  websiteCol = e.target.value;
  filterPhones();
});

phoneSelect.addEventListener("change", (e) => {
  phoneCol = e.target.value;
  filterPhones();
});

function filterPhones() {
  if (!phoneCol) {
    downloadBtn.disabled = true;
    return;
  }

  const normalize = (v) => (typeof v === "string" ? v.trim() : v ?? "");

  const noWebsiteRows = rows.filter((r) => {
    if (!websiteCol) return true;
    const w = normalize(r[websiteCol]);
    return !w || w.toLowerCase() === "not found" || /^\s*(n\/a|none|not\s*available|-)?\s*$/i.test(w);
  });

  phonesFiltered = noWebsiteRows
    .map((r) => normalize(r[phoneCol]))
    .filter((p) => p && p.toLowerCase() !== "n/a");

  phonesFiltered = [...new Set(phonesFiltered)];

  renderPhones();
  downloadBtn.disabled = phonesFiltered.length === 0;
}

function renderPhones() {
  outputDiv.innerHTML = "";
  if (!phonesFiltered.length) return;

  const list = document.createElement("ol");
  phonesFiltered.slice(0, 200).forEach((p) => {
    const li = document.createElement("li");
    li.textContent = p;
    list.appendChild(li);
  });
  outputDiv.appendChild(list);
}

// Download CSV
downloadBtn.addEventListener("click", () => {
  if (!phonesFiltered.length) return;

  const csv = Papa.unparse({ fields: ["phone"], data: phonesFiltered.map((p) => [p]) });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "no-website-phones.csv";
  a.click();
  URL.revokeObjectURL(url);
});
