import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState("New");

  const fetchLead = async () => {
    try {
      const res = await API.get(`/leads/${id}`);
      const leadData = res.data;
      setLead(leadData);
      setName(leadData.name || "");
      setEmail(leadData.email || "");
      setPhone(leadData.phone || "");
      setCompany(leadData.company || "");
      setStatus(leadData.status || "New");
      setError("");
    } catch (err) {
      console.error("LeadDetail fetch error", err);
      setError("Could not load lead details. Please try again.");
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  if (!lead) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-card">
          <Navbar />
          <h2>Lead Detail</h2>
          {error ? <p className="dashboard-error">{error}</p> : <p>Loading...</p>}
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await API.put(`/leads/${id}`, { name, email, phone, company, status });
      setEditMode(false);
      await fetchLead();
    } catch (err) {
      console.error("update error", err);
      setError("Update failed");
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <Navbar />

        <h2>Lead Detail</h2>
        {error && <p className="dashboard-error">{error}</p>}

        <div className="lead-detail-card">
          {editMode ? (
            <>
              <input
                className="dashboard-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="dashboard-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="dashboard-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                className="dashboard-input"
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
            </>
          ) : (
            <>
              <p>
                <strong>Name:</strong> {lead.name}
              </p>
              <p>
                <strong>Email:</strong> {lead.email}
              </p>
              <p>
                <strong>Phone:</strong> {lead.phone || '-'}
              </p>
              <p>
                <strong>Company:</strong> {lead.company || '-'}
              </p>
              <p>
                <strong>Status:</strong> {lead.status || 'New'}
              </p>
              <p>
                <strong>Created At:</strong>{' '}
                {new Date(lead.createdAt).toLocaleString()}
              </p>
            </>
          )}
        </div>

        {editMode ? (
          <>
            <button className="dashboard-button" onClick={handleSave}>
              Save
            </button>
            <button className="dashboard-button" onClick={() => setEditMode(false)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="dashboard-button" onClick={() => setEditMode(true)}>
            Edit
          </button>
        )}

        <button className="dashboard-button" onClick={() => navigate('/leads')}>
          Back to list
        </button>
      </div>
    </div>
  );
}
