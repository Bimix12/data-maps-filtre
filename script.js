const input = document.getElementById("csvInput");
const columns = document.getElementById("columns");
const results = document.getElementById("results");
const downloadButton = document.getElementById("download");

let data = [], uniquePhones = [];

input.addEventListener("change", (e) => {
  Papa.parse(e.target.files[0], { header:true, skipEmptyLines:true,
    complete: (res) => {
      data = res.data;
      const headers = Object.keys(data[0] || {});
      if (!headers.length) return alert("CSV is empty");
      columns.innerHTML = `
        <select id="webCol"><option value="">No website column</option>${headers.map(h=>`<option>${h}</option>`)}</select>
        <select id="phCol"><option value="">Phone column</option>${headers.map(h=>`<option>${h}</option>`)}</select>
      `;
      document.getElementById("phCol").addEventListener("change", filter);
    }
  });
});

function filter(){
  const web = document.getElementById("webCol").value;
  const phone = document.getElementById("phCol").value;
  if (!phone) return;
  uniquePhones = Array.from(new Set(data
    .filter(r => !web || !r[web])
    .map(r => r[phone]).filter(Boolean)
  ));
  results.innerHTML = uniquePhones.map(p => `<li>${p}</li>`).join("");
  if (uniquePhones.length) downloadButton.hidden = false;
}

downloadButton.addEventListener("click", () => {
  const csv = Papa.unparse({ fields:["phone"], data: uniquePhones.map(p=>[p]) });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "phones.csv";
  a.click();
});

// drag & drop
document.querySelector(".container").addEventListener("dragover", e=>e.preventDefault());
document.querySelector(".container").addEventListener("drop", e=>{
  e.preventDefault();
  input.files = e.dataTransfer.files;
  input.dispatchEvent(new Event("change"));
});
