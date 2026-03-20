import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchLeads = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.order = sortOrder;

      const res = await API.get("/leads", { params });
      setLeads(res.data);
      setError("");
    } catch (err) {
      console.error("LeadList fetch error", err);
      setError("Could not reach backend; displaying demo leads.");
      setLeads([
        { _id: "demo-1", name: "Demo User", email: "demo@example.com" },
        { _id: "demo-2", name: "Example Lead", email: "example@demo.com" },
      ]);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">
        <Navbar />

        <h2>Lead List</h2>

        {error && <p className="dashboard-error">{error}</p>}

        <div className="lead-controls">
          <input
            className="dashboard-input"
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            className="dashboard-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Converted">Converted</option>
          </select>

          <select
            className="dashboard-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
          </select>

          <select
            className="dashboard-input"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>

          <button className="dashboard-button" onClick={fetchLeads}>
            Apply
          </button>
        </div>

        <div className="lead-list">
          {leads
            .filter((lead) =>
              lead.name.toLowerCase().includes(query.toLowerCase()) ||
              lead.email.toLowerCase().includes(query.toLowerCase())
            )
            .map((lead) => (
            <div key={lead._id} className="lead-item">
              <div className="lead-text">
                <span>{lead.name}</span>
                <span>{lead.email}</span>
                <span>{lead.phone || "-"}</span>
                <span>{lead.company || "-"}</span>
                <span className="lead-status">{lead.status || "New"}</span>
              </div>
              <Link className="lead-view" to={`/leads/${lead._id}`}>
                View
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
