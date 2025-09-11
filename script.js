const csvInput = document.getElementById("csvInput");
const websiteColSelect = document.getElementById("websiteCol");
const phoneColSelect = document.getElementById("phoneCol");
const controls = document.getElementById("controls");
const results = document.getElementById("results");
const phoneList = document.getElementById("phoneList");
const status = document.getElementById("status");
const downloadBtn = document.getElementById("downloadBtn");

let parsedData = [];
let phonesNoWebsite = [];

csvInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  status.textContent = `Parsing ${file.name}...`;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      parsedData = results.data;
      status.textContent = `Loaded ${parsedData.length} rows.`;

      // fill selects with headers
      const headers = results.meta.fields;
      websiteColSelect.innerHTML = "";
      phoneColSelect.innerHTML = "";

      headers.forEach((h) => {
        const opt1 = document.createElement("option");
        opt1.value = h;
        opt1.textContent = h;
        websiteColSelect.appendChild(opt1);

        const opt2 = document.createElement("option");
        opt2.value = h;
        opt2.textContent = h;
        phoneColSelect.appendChild(opt2);
      });

      controls.classList.remove("hidden");
    }
  });
});

downloadBtn.addEventListener("click", () => {
  const websiteCol = websiteColSelect.value;
  const phoneCol = phoneColSelect.value;

  if (!phoneCol) {
    alert("Please select a phone column");
    return;
  }

  phonesNoWebsite = parsedData
    .filter(row => (!row[websiteCol] || row[websiteCol].trim() === ""))
    .map(row => row[phoneCol])
    .filter(p => p && p.trim() !== "");

  phoneList.innerHTML = "";
  phonesNoWebsite.forEach(phone => {
    const li = document.createElement("li");
    li.textContent = phone;
    phoneList.appendChild(li);
  });

  results.classList.remove("hidden");

  // download CSV
  const csvContent = "data:text/csv;charset=utf-8," + phonesNoWebsite.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "phones_no_website.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
