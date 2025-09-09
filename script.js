const fileInput = document.getElementById("csvInput");
const statusEl = document.getElementById("status");
const websiteColSelect = document.getElementById("websiteCol");
const phoneColSelect = document.getElementById("phoneCol");
const controls = document.getElementById("controls");
const results = document.getElementById("results");
const phoneList = document.getElementById("phoneList");
const downloadBtn = document.getElementById("downloadBtn");

let rows = [];
let fileName = "";

fileInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  statusEl.textContent = "Parsing CSV...";
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (res) => {
      rows = res.data;
      if (!rows.length) {
        statusEl.textContent = "No rows found in the CSV.";
        return;
      }
      const headers = Object.keys(rows[0]);
      websiteColSelect.innerHTML = `<option value="">(No column — treat all as no website)</option>`;
      phoneColSelect.innerHTML = `<option value="">Select phone column</option>`;
      headers.forEach((h) => {
        websiteColSelect.innerHTML += `<option value="${h}">${h}</option>`;
        phoneColSelect.innerHTML += `<option value="${h}">${h}</option>`;
      });
      statusEl.textContent = `File loaded: ${file.name}`;
      fileName = file.name;
      controls.classList.remove("hidden");
    }
  });
});

downloadBtn.addEventListener("click", () => {
  const websiteCol = websiteColSelect.value;
  const phoneCol = phoneColSelect.value;
  if (!phoneCol) return alert("Please select a phone column!");
  const phones = Array.from(new Set(
    rows
      .filter((r) => {
        const w = (r[websiteCol] || "").trim().toLowerCase();
        return !w || w === "not found" || /^(n\/a|none|not available|-)?$/i.test(w);
      })
      .map((r) => (r[phoneCol] || "").trim())
      .filter((p) => p)
  ));
  results.classList.remove("hidden");
  phoneList.innerHTML = phones.map((p) => `<li>${p}</li>`).join("");

  const csv = Papa.unparse({
    fields: ["phone"],
    data: phones.map((p) => [p])
  });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const base = fileName ? fileName.replace(/\.csv$/i, "") : "phones";
  a.download = `${base}_no-website_phones.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
});
