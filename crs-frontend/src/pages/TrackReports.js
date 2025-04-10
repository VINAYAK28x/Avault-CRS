import React, { useState, useEffect } from "react";

const TrackReports = () => {
  const [reports, setReports] = useState([]); // Store crime reports
  const [searchTerm, setSearchTerm] = useState(""); // Search input
  const [sortBy, setSortBy] = useState("newest"); // Sorting order

  // Dummy reports (Replace this with API or Blockchain data later)
  useEffect(() => {
    const dummyReports = [
      { id: 1, title: "Robbery in Downtown", location: "New York", description: "A man was robbed at gunpoint.", date: "2025-03-05", status: "Pending" },
      { id: 2, title: "Hit and Run", location: "Los Angeles", description: "A car hit a pedestrian and fled.", date: "2025-03-03", status: "Resolved" },
      { id: 3, title: "Burglary at Night", location: "Chicago", description: "A house was broken into while the owners were away.", date: "2025-03-02", status: "Investigating" }
    ];
    setReports(dummyReports);
  }, []);

  // Filter reports based on search term
  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort reports by date
  const sortedReports = [...filteredReports].sort((a, b) => {
    return sortBy === "newest"
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date);
  });

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Track Prior Reports</h2>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search reports..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: "8px", width: "50%", marginBottom: "10px" }}
      />

      {/* Sort Dropdown */}
      <div>
        <label>Sort by: </label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {/* Display Reports */}
      <div>
        {sortedReports.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {sortedReports.map(report => (
              <li key={report.id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0", borderRadius: "5px" }}>
                <h3>{report.title}</h3>
                <p><strong>Location:</strong> {report.location}</p>
                <p><strong>Description:</strong> {report.description}</p>
                <p><strong>Date:</strong> {new Date(report.date).toDateString()}</p>
                <p><strong>Status:</strong> {report.status}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No reports found.</p>
        )}
      </div>
    </div>
  );
};

export default TrackReports;
