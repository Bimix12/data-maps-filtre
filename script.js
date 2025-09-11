document.getElementById("csvInput").addEventListener("change", handleFile);

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const rows = results.data;
      const headers = results.meta.fields;

      const websiteCol = document.getElementById("websiteCol");
      const phoneCol = document.getElementById("phoneCol");

      websiteCol.innerHTML = `<option value="">(No column)</option>`;
      phoneCol.innerHTML = `<option value="">Select column</option>`;

      headers.forEach(h => {
        websiteCol.innerHTML += `<option value="${h}">${h}</option>`;
        phoneCol.innerHTML += `<option value="${h}">${h}</option>`;
      });

      document.getElementById("controls").classList.remove("hidden");

      document.getElementById("downloadBtn").onclick = () => {
        const wCol = websiteCol.value;
        const pCol = phoneCol.value;

        const phones = rows
          .filter(r => !r[wCol] || r[wCol].trim() === "")
          .map(r => r[pCol])
          .filter(p => p);

        const uniquePhones = [...new Set(phones)];

        const list = document.getElementById("phoneList");
        list.innerHTML = "";
        uniquePhones.forEach(p => {
          const li = document.createElement("li");
          li.textContent = p;
          list.appendChild(li);
        });

        document.getElementById("results").classList.remove("hidden");

        // download CSV
        const csv = Papa.unparse({ fields: ["phone"], data: uniquePhones.map(p => [p]) });
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "phones_no_website.csv";
        a.click();
      };
    }
  });
}
