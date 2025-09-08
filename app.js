// App JS - handles CSV parsing, filtering and download
(function(){
  const fileInput = document.getElementById('fileInput');
  const chooseBtn = document.getElementById('chooseBtn');
  const uploadArea = document.getElementById('uploadArea');
  const websiteSelect = document.getElementById('websiteSelect');
  const phoneSelect = document.getElementById('phoneSelect');
  const controls = document.getElementById('controls');
  const extractBtn = document.getElementById('extractBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const resetBtn = document.getElementById('resetBtn');
  const stats = document.getElementById('stats');
  const results = document.getElementById('results');
  const resultsTableBody = document.querySelector('#resultsTable tbody');
  const totalRowsEl = document.getElementById('totalRows');
  const noWebsiteRowsEl = document.getElementById('noWebsiteRows');
  const phonesCountEl = document.getElementById('phonesCount');

  let parsedRows = [];
  let filteredPhones = [];

  chooseBtn.addEventListener('click', ()=> fileInput.click());
  uploadArea.addEventListener('drop', handleDrop);
  uploadArea.addEventListener('dragover', (e)=> e.preventDefault());
  fileInput.addEventListener('change', (e)=> handleFile(e.target.files[0]));

  resetBtn.addEventListener('click', resetAll);

  function handleDrop(e){
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if(f) handleFile(f);
  }

  function handleFile(file){
    if(!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h)=> (h||'').trim(),
      complete: function(res){
        parsedRows = (res.data || []).filter(r => Object.keys(r).length > 0);
        if(!parsedRows.length){
          alert('No rows found in CSV');
          return;
        }
        populateColumnSelectors(parsedRows);
      },
      error: function(err){
        alert('CSV parse error: '+err.message);
      }
    });
  }

  function populateColumnSelectors(rows){
    const hdrs = Object.keys(rows[0]);
    websiteSelect.innerHTML = '';
    phoneSelect.innerHTML = '';
    const optNone = document.createElement('option');
    optNone.value = '';
    optNone.textContent = '(No column — treat all as no website)';
    websiteSelect.appendChild(optNone);

    hdrs.forEach(h => {
      const o1 = document.createElement('option');
      o1.value = h; o1.textContent = h;
      websiteSelect.appendChild(o1);
      const o2 = document.createElement('option');
      o2.value = h; o2.textContent = h;
      phoneSelect.appendChild(o2);
    });

    // auto-guess common names
    const lower = hdrs.map(h=>h.toLowerCase());
    const websiteGuess = hdrs[lower.findIndex(h=>['website','web site','site','url','homepage','home page'].some(k=>h.includes(k)))];
    const phoneGuess = hdrs[lower.findIndex(h=>['phone','telephone','tel','mobile','cell','contact number'].some(k=>h.includes(k)))];
    if(websiteGuess) websiteSelect.value = websiteGuess;
    if(phoneGuess) phoneSelect.value = phoneGuess;

    controls.classList.remove('hidden');
    stats.classList.add('hidden');
    results.classList.add('hidden');
    downloadBtn.disabled = true;
  }

  extractBtn.addEventListener('click', ()=> {
    const websiteCol = websiteSelect.value;
    const phoneCol = phoneSelect.value;
    if(!phoneCol){
      alert('Please select a phone column first.');
      return;
    }
    // normalize function
    const normalize = v => (typeof v === 'string' ? v.trim() : (v==null ? '' : String(v))).trim();
    const noWebsiteRows = parsedRows.filter(r => {
      if(!websiteCol) return true;
      const w = normalize(r[websiteCol]);
      // treat many representations as missing
      if(!w) return true;
      const wl = w.toLowerCase();
      if(wl === 'not found' || wl === 'n/a' || wl==='none' || /^https?:\/\/(maps\\.google\\.com|www\\.googleadservices\\.com)/.test(wl) ) {
        // googleadservices ad links often appear as adurl= , treat as having website? We consider them as website => exclude.
      }
      // If website field seems like a URL (contains . or http) we treat it as present
      const looksLikeUrl = /https?:\\/\\//i.test(w) || /\\./.test(w);
      return !looksLikeUrl;
    });

    // extract phones from noWebsiteRows
    const phones = [];
    const rowsPreview = [];
    for(const r of noWebsiteRows){
      const p = normalize(r[phoneCol]);
      if(p && p.toLowerCase() !== 'n/a'){
        if(!phones.includes(p)) phones.push(p);
        rowsPreview.push({name: r[Object.keys(r)[0]] || '', phone: p}); // show first col as name if available
      }
    }

    filteredPhones = phones;
    // update stats and UI
    totalRowsEl.textContent = parsedRows.length;
    noWebsiteRowsEl.textContent = noWebsiteRows.length;
    phonesCountEl.textContent = filteredPhones.length;
    stats.classList.remove('hidden');

    // fill table preview (unique, first 200)
    resultsTableBody.innerHTML = '';
    const preview = rowsPreview.slice(0,200);
    preview.forEach((row,i)=>{
      const tr = document.createElement('tr');
      const tdIdx = document.createElement('td'); tdIdx.textContent = i+1;
      const tdName = document.createElement('td'); tdName.textContent = row.name || '';
      const tdPhone = document.createElement('td'); tdPhone.textContent = row.phone;
      tr.appendChild(tdIdx); tr.appendChild(tdName); tr.appendChild(tdPhone);
      resultsTableBody.appendChild(tr);
    });
    results.classList.remove('hidden');
    downloadBtn.disabled = filteredPhones.length === 0;
  });

  downloadBtn.addEventListener('click', ()=>{
    if(!filteredPhones || !filteredPhones.length) return;
    // build CSV with single column 'phone'
    const lines = [['phone'], ...filteredPhones.map(p=>[p])];
    const csv = Papa.unparse({fields: ['phone'], data: filteredPhones.map(p=>[p])});
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

  function resetAll(){
    parsedRows = [];
    filteredPhones = [];
    fileInput.value = '';
    websiteSelect.innerHTML = '';
    phoneSelect.innerHTML = '';
    controls.classList.add('hidden');
    stats.classList.add('hidden');
    results.classList.add('hidden');
    downloadBtn.disabled = true;
  }

})();