const csvInput = document.getElementById("csvInput");
const dropArea = document.getElementById("drop-area");
const errorDiv = document.getElementById("error");
const websiteColSelect = document.getElementById("websiteCol");
const phoneColSelect = document.getElementById("phoneCol");
const columnsSection = document.getElementById("columns-section");
const downloadBtn = document.getElementById("downloadBtn");
const phonesSection = document.getElementById("phones-section");
const phonesList = document.getElementById("phonesList");

let rows = [];

function reset() {
  rows = [];
  columnsSection.classList.add("hidden");
  phonesSection.classList.add("hidden");
  websiteColSelect.innerHTML = "";
  phoneColSelect.innerHTML = "";
  errorDiv.textContent = "";
}

function handleFile(file) {
  reset();
  if (!file) return;
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      rows = results.data;
      if (!rows.length) {
        errorDiv.textContent = "No rows found in CSV.";
        return;
      }
      const headers = Object.keys(rows[0]);
      headers.forEach(h => {
        websiteColSelect.innerHTML += `<option value="${h}">${h}</option>`;
        phoneColSelect.innerHTML += `<option value="${h}">${h}</option>`;
      });
      columnsSection.classList.remove("hidden");
    },
    error: function() {
      errorDiv.textContent = "Error parsing CSV.";
    }
  });
}

csvInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

dropArea.addEventListener("dragover", (e) => {
  e.preventDefault();
});

dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  handleFile(e.dataTransfer.files[0]);
});

downloadBtn.addEventListener("click", () => {
  const websiteCol = websiteColSelect.value;
  const phoneCol = phoneColSelect.value;
  if (!phoneCol) return alert("Select phone column!");

  const phones = Array.from(new Set(
    rows.filter(r => {
      const w = r[websiteCol] ? r[websiteCol].trim() : "";
      return !w || w.toLowerCase() === "not found" || /^\s*(n\/a|none|not\s*available|-)?\s*$/i.test(w);
    }).map(r => r[phoneCol] ? r[phoneCol].trim() : "").filter(p => p)
  ));

  phonesList.innerHTML = phones.map(p => `<li>${p}</li>`).join("");
  phonesSection.classList.remove("hidden");

  // download CSV
  const csv = Papa.unparse({fields: ["phone"], data: phones.map(p => [p])});
  const blob = new Blob([csv], {type: "text/csv;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "phones_no_website.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
});
