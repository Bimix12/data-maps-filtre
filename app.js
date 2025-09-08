const fileInput = document.getElementById('csvInput');
const controls = document.getElementById('controls');
const output = document.getElementById('output');

let rows = [], headers = [], websiteCol = '', phoneCol = '';

fileInput.addEventListener('change', e => {
  const f = e.target.files[0];
  if (!f) return;
  Papa.parse(f, {
    header:true, skipEmptyLines:true,
    complete: res => {
      rows = res.data;
      headers = Object.keys(rows[0]||{});
      renderSelectors();
    }
  });
});

function renderSelectors(){
  controls.innerHTML = `
    <select id="selWeb"><option value="">No website col</option>${headers.map(h => `<option>${h}</option>`)}</select>
    <select id="selPhone"><option value="">Select phone col</option>${headers.map(h => `<option>${h}</option>`)}</select>
    <button id="btn">Extract</button>
  `;
  document.getElementById('btn').addEventListener('click', extractPhones);
}

function extractPhones(){
  websiteCol = document.getElementById('selWeb').value;
  phoneCol = document.getElementById('selPhone').value;
  if (!phoneCol) return alert('Select phone col!');
  const normalize = v => typeof v==='string'?v.trim():(v??'');
  const arr = rows.filter(r => {
    if (!websiteCol) return true;
    const w = normalize(r[websiteCol]);
    return !w || w.toLowerCase()==='n/a';
  }).map(r => normalize(r[phoneCol])).filter(p=>p);
  const phones = [...new Set(arr)];
  renderPhones(phones);
}

function renderPhones(phones){
  output.innerHTML = phones.length
    ? `<div>Found: ${phones.length}</div><div class="table-container"><table><thead><tr><th>#</th><th>Phone</th></tr></thead><tbody>${phones.map((p,i)=>`<tr><td>${i+1}</td><td>${p}</td></tr>`).join('')}</tbody></table><button id="dl">Download CSV</button></div>`
    : '<p>No phones found</p>';
  const dl = document.getElementById('dl');
  if(dl) dl.addEventListener('click', () => {
    const csv = Papa.unparse({fields:['phone'], data:phones.map(p=>[p])});
    const blob = new Blob([csv], {type:'text/csv'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'phones.csv'; a.click();
  });
}
