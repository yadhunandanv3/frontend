import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("New");
  const [importCsv, setImportCsv] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importErrors, setImportErrors] = useState([]);
  const [importProgress, setImportProgress] = useState({ totalRows: 0, processedRows: 0, inserted: 0, failed: 0 });
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const fetchLeads = async () => {
    try {
      const res = await API.get("/leads");
      setLeads(res.data);
      setError("");
    } catch (err) {
      console.error("fetchLeads error", err);
      setError("Could not reach backend. Showing local demo leads.");
      // fall back to local placeholder data so UI remains testable without backend
      setLeads((prev) => (prev.length ? prev : [{ _id: "1", name: "Demo User", email: "demo@example.com" }]));
    }
  };

  const createLead = async () => {
    if (!name || !email) {
      setError("Please enter name and email.");
      return;
    }
    try {
      await API.post("/leads", { name, email, phone, company, status });
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setStatus("New");
      setError("");
      await fetchLeads();
    } catch (err) {
      console.error("createLead error", err);
      setError("Could not create lead via backend. Adding locally for demo.");
      setLeads((prev) => [...prev, { _id: Date.now().toString(), name, email, phone, company, status }]);
      setName("");
      setEmail("");
      setPhone("");
      setCompany("");
      setStatus("New");
    }
  };

  const deleteLead = async (id) => {
    try {
      await API.delete(`/leads/${id}`);
      setError("");
      await fetchLeads();
    } catch (err) {
      console.error("deleteLead error", err);
      setError("Could not delete lead via backend. Removing locally for demo.");
      setLeads((prev) => prev.filter((lead) => lead._id !== id));
    }
  };

  const updateLead = async (id, values) => {
    try {
      await API.put(`/leads/${id}`, values);
      await fetchLeads();
    } catch (err) {
      console.error("updateLead error", err);
      setError("Could not update lead");
    }
  };

  const handleExport = async () => {
    try {
      const response = await API.get('/leads/export', { responseType: 'blob' });
      const href = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', 'leads.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('export error', err);
      setError('Failed to export CSV');
    }
  };

  const parseCsvRows = (csvText) => {
    const rows = [];
    let current = '';
    let inQuotes = false;
    const row = [];

    for (let i = 0; i < csvText.length; i++) {
      const ch = csvText[i];

      if (ch === '"') {
        if (inQuotes && csvText[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (ch === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
        continue;
      }

      if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && csvText[i + 1] === '\n') i += 1;
        row.push(current.trim());
        rows.push([...row]);
        row.length = 0;
        current = '';
        continue;
      }

      current += ch;
    }

    if (current !== '' || row.length > 0) {
      row.push(current.trim());
      rows.push([...row]);
    }

    return rows.filter((r) => r.some((cell) => cell !== ''));
  };

  const rowToCsv = (row) =>
    row
      .map((value) => {
        if (value == null) return '';
        const stringValue = `${value}`;
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',');

  const handleBatchImport = async () => {
    if (!importCsv.trim()) {
      setImportStatus('Please select or drop a CSV file first.');
      return;
    }

    const rows = parseCsvRows(importCsv);
    if (rows.length < 2) {
      setImportStatus('CSV must have a header and at least one data row.');
      return;
    }

    const header = rows[0];
    const dataRows = rows.slice(1);
    const chunkSize = 20;

    setImportProgress({ totalRows: dataRows.length, processedRows: 0, inserted: 0, failed: 0 });
    setImportStatus('Batch import started');
    setImportErrors([]);

    let totalInserted = 0;
    let totalFailed = 0;
    const allErrors = [];

    for (let start = 0; start < dataRows.length; start += chunkSize) {
      const chunkRows = dataRows.slice(start, start + chunkSize);
      const chunkCsv = [rowToCsv(header), ...chunkRows.map(rowToCsv)].join('\n');

      try {
        const res = await API.post('/leads/import', { csv: chunkCsv });
        const imported = res.data.imported || 0;
        const errors = res.data.errors || [];

        totalInserted += imported;
        totalFailed += errors.length;

        errors.forEach((err) => {
          allErrors.push({ row: err.row + start, errors: err.errors });
        });
      } catch (err) {
        console.error('batch chunk error', err);
        totalFailed += chunkRows.length;
        allErrors.push({ row: start + 1, errors: ['Chunk import failed'] });
      }

      setImportProgress((prev) => ({
        ...prev,
        processedRows: Math.min(prev.totalRows, prev.processedRows + chunkRows.length),
        inserted: totalInserted,
        failed: totalFailed,
      }));
    }

    setImportStatus(`Batch done: inserted ${totalInserted}, failed ${totalFailed}`);
    setImportErrors(allErrors);
    setImportCsv('');
    setImportFileName('');

    await fetchLeads();
  };

  const loadCsvText = (text, fileName = '') => {
    setImportCsv(text);
    setImportFileName(fileName);
    setImportStatus(`Loaded ${fileName}.`);
    setImportErrors([]);
  };

  const onFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setImportFileName('');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportStatus('Please select a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => loadCsvText(e.target.result, file.name);
    reader.onerror = () => {
      setImportStatus('Could not read file.');
      setImportCsv('');
    };
    reader.readAsText(file);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => {
    setDragging(false);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportStatus('Please drop a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => loadCsvText(e.target.result, file.name);
    reader.onerror = () => {
      setImportStatus('Could not read file.');
      setImportCsv('');
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <Navbar />

        <h2>Leads</h2>

        {error && <p className="dashboard-error">{error}</p>}

        <div className="dashboard-import">
          <h3>Bulk CSV Import (Drag and Drop)</h3>
          <div
            className={`dashboard-dropzone ${dragging ? 'dragging' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <p>Drop a CSV file here, or click browse</p>
            <input
              type="file"
              accept=".csv"
              onChange={onFileChange}
              className="dashboard-input"
            />
          </div>
          {importFileName && <p>Ready to import: {importFileName}</p>}
          <button className="dashboard-button" onClick={handleBatchImport}>
            Import CSV
          </button>
          {importStatus && <p className="dashboard-success">{importStatus}</p>}
          {importProgress.totalRows > 0 && (
            <div className="dashboard-info">
              <p>Processed {importProgress.processedRows}/{importProgress.totalRows} rows</p>
              <p>Inserted {importProgress.inserted}, Failed {importProgress.failed}</p>
            </div>
          )}
          {importErrors.length > 0 && (
            <div className="dashboard-error-list">
              <strong>Row validation errors:</strong>
              <ul>
                {importErrors.map((item, idx) => (
                  <li key={idx}>Row {item.row ?? 'N/A'}: {item.errors.join('; ')}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button className="dashboard-button" style={{ marginBottom: '1rem' }} onClick={handleExport}>
          Export CSV
        </button>

        <div className="dashboard-form">
          <input
            className="dashboard-input"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="dashboard-input"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="dashboard-input"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="dashboard-input"
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <select
            className="dashboard-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
          </select>
          <button className="dashboard-button" onClick={createLead}>
            Add Lead
          </button>
        </div>



        <div className="lead-list">
          {leads.map((lead) => (
              <div key={lead._id} className="lead-item">
                <div className="lead-text">
                  <span>{lead.name}</span>
                  <span>{lead.email}</span>
                  <span>{lead.phone || "-"}</span>
                  <span>{lead.company || "-"}</span>
                  <span className="lead-status">{lead.status}</span>
                </div>
                <div className="lead-item-actions">
                  <Link className="lead-view" to={`/leads/${lead._id}`}>
                    View
                  </Link>
                  <button
                    className="lead-delete"
                    onClick={() => deleteLead(lead._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}