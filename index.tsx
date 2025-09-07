import React, { useCallback, useMemo, useRef, useState } from "react";
import Papa from "papaparse";

export default function NoWebsitePhoneExtractor() {
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [websiteCol, setWebsiteCol] = useState("");
  const [phoneCol, setPhoneCol] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);

  const resetAll = useCallback(() => {
    setFileName("");
    setHeaders([]);
    setRows([]);
    setWebsiteCol("");
    setPhoneCol("");
    setError("");
    setLoading(false);
  }, []);

  const handleCsv = useCallback((file) => {
    if (!file) return;
    setLoading(true);
    setError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (res) => {
        try {
          const data = (res.data || []).filter((r) => Object.keys(r).length > 0);
          if (!data.length) {
            setError("No rows found in the CSV.");
            setLoading(false);
            return;
          }
          setHeaders(Object.keys(data[0]));
          setRows(data);
          setFileName(file.name);
          setLoading(false);
        } catch (e) {
          console.error(e);
          setError("Failed to parse CSV. Please check the file.");
          setLoading(false);
        }
      },
      error: (err) => {
        console.error(err);
        setError("CSV parsing error. Try another file.");
        setLoading(false);
      },
    });
  }, []);

  const onFileInput = useCallback((e) => {
    const file = e.target.files?.[0];
    handleCsv(file);
  }, [handleCsv]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    handleCsv(file);
  }, [handleCsv]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Filter only rows where website column is empty, missing, or invalid
  const filteredPhones = useMemo(() => {
    if (!rows.length || !phoneCol) return [];

    const normalize = (v) => (typeof v === "string" ? v.trim() : v ?? "");

    const noWebsiteRows = rows.filter((r) => {
      if (!websiteCol) return true;
      const w = normalize(r[websiteCol]);
      return !w || w.toLowerCase() === 'not found' || /^\s*(n\/a|none|not\s*available|-)?\s*$/i.test(w);
    });

    const allPhones = noWebsiteRows
      .map((r) => normalize(r[phoneCol]))
      .filter((p) => p && p.toLowerCase() !== "n/a");

    return Array.from(new Set(allPhones));
  }, [rows, phoneCol, websiteCol]);

  const downloadCsv = useCallback(() => {
    if (!filteredPhones.length) return;
    const csv = Papa.unparse({ fields: ["phone"], data: filteredPhones.map((p) => [p]) });
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
  }, [filteredPhones, fileName]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">No‑Website Phone Extractor</h1>
          <p className="text-sm text-gray-600 mt-2">
            Upload a CSV, select the Website and Phone columns, and get phone numbers of businesses without a website.
          </p>
        </header>

        {!rows.length && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <label htmlFor="csvInput" className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl shadow border bg-gray-100 hover:bg-gray-200 cursor-pointer">
              <span>Select CSV file</span>
            </label>
            <input id="csvInput" type="file" accept=".csv" className="hidden" onChange={onFileInput} />
            <div ref={dropRef} onDrop={onDrop} onDragOver={onDragOver} className="mt-4 border-2 border-dashed rounded-2xl p-8 text-center text-gray-500">
              Drag & drop your CSV here
            </div>
            {loading && <div className="mt-4 text-sm text-gray-600">Parsing CSV…</div>}
            {error && <div className="mt-4 text-sm text-red-600">{error}</div>}
          </div>
        )}

        {rows.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <div><span className="font-medium">File:</span> {fileName || "(unnamed)"}</div>
              <button onClick={resetAll} className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 border">Reset</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Website column</label>
                <select className="w-full border rounded-xl p-2 bg-white" value={websiteCol} onChange={(e) => setWebsiteCol(e.target.value)}>
                  <option value="">(No column — treat all as no website)</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Phone column *</label>
                <select className="w-full border rounded-xl p-2 bg-white" value={phoneCol} onChange={(e) => setPhoneCol(e.target.value)}>
                  <option value="">Select phone column</option>
                  {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {filteredPhones.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-gray-600">Unique phone numbers of entries without a website ready to download.</div>
                  <button onClick={downloadCsv} className="px-4 py-2 rounded-2xl bg-black text-white">Download CSV</button>
                </div>
                <div className="border rounded-2xl p-4 max-h-72 overflow-auto">
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    {filteredPhones.slice(0, 200).map((p, i) => <li key={i} className="break-all">{p}</li>)}
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="text-xs text-gray-500 mt-8">
          <p>All processing happens in your browser. Nothing is uploaded to any server.</p>
        </footer>
      </div>
    </div>
  );
}
