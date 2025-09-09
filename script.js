const fileInput = document.getElementById("csvInput");
const statusEl = document.getElementById("status");
const websiteColSelect = document.getElementById("websiteCol");
const phoneColSelect = document.getElementById("phoneCol");
const controls = document.getElementById("controls");
const results = document.getElementById("results");
const phoneList = document.getElementById("phoneList");
const downloadBtn = document.getElementById("downloadBtn");

let headers = [];
let rows = [];
let fileName = "";

fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  statusEl.textContent = "Parsing CSV...";
  statusEl.className = "";

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
    complete: (res) => {
      try {
        rows = (res.data || []).filter((r) => Object.keys(r).length > 0);
        if (!rows.length) {
          statusEl.textContent = "No rows found in the CSV.";
          statusEl.className = "error";
          return;
        }

        headers = Object.keys(rows[0]);
        websiteColSelect.innerHTML = `<option value="">(No column — treat all as no website)</option>`;
        phoneColSelect.innerHTML = `<option value="">Select phone column</option>`;
        headers.forEach((h) => {
          websiteColSelect.innerHTML += `<option value="${h}">${h}</option>`;
          phoneColSelect.innerHTML += `<option value="${h}">${h}</option>`;
        });

        fileName = file.name;
        statusEl.textContent = `File loaded: ${file.name}`;
        statusEl.className = "success";
        controls.classList.remove("hidden");
      } catch (e) {
        console.error(e);
        statusEl.textContent = "Failed to parse CSV.";
        statusEl.className = "error";
      }
    },
    error: (err) => {
      console.error(err);
      statusEl.textContent = "CSV parsing error.";
      statusEl.className = "error";
    },
  });
});

downloadBtn.addEventListener("click", () => {
  const websiteCol = websiteColSelect.value;
  const phoneCol = phoneColSelect.value;
  if (!phoneCol) {
    alert("Please select a phone column!");
    return;
  }

  const normalize = (v) => (typeof v === "string" ? v.trim() : v ?? "");
  const noWebsiteRows = rows.filter((r) => {
    if (!websiteCol) return true;
    const w = normalize(r[websiteCol]);
    return (
      !w ||
      w.toLowerCase() === "not found" ||
      /^\s*(n\/a|none|not\s*available|-)?\s*$/i.test(w)
    );
  });

  const phones = noWebsiteRows
    .map((r) => normalize(r[phoneCol]))
    .filter((p) => p && p.toLowerCase() !== "n/a");

  const uniquePhones = Array.from(new Set(phones));

  if (!uniquePhones.length) {
    alert("No phone numbers found without websites.");
    return;
  }

  // Show in UI
  phoneList.innerHTML = uniquePhones
    .slice(0, 200)
    .map((p) => `<li>${p}</li>`)
    .join("");
  results.classList.remove("hidden");

  // Download CSV
  const csv = Papa.unparse({
    fields: ["phone"],
    data: uniquePhones.map((p) => [p]),
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const base = fileName ? fileName.replace(/\.csv$/i, "") : "phones";
  a.download = `${base}_no-website_phones.csv`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
});
