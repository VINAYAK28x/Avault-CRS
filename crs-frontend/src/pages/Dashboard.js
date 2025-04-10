import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import api from "../api";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [crimeReport, setCrimeReport] = useState("");
  const [reports, setReports] = useState([]);
  const navigate = useNavigate();

  // Fetch wallet address from MetaMask
  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_accounts", []);
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      }
    };
    fetchWalletAddress();
  }, []);

  // Fetch crime reports from backend
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get("/reports");
        setReports(response.data);
      } catch (error) {
        alert("Please log in first.");
        navigate("/login");
      }
    };
    fetchReports();
  }, [navigate]);

  // Handle report submission
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!crimeReport.trim()) return;

    try {
      const response = await api.post("/reports", { description: crimeReport });
      setReports([...reports, response.data]);
      setCrimeReport("");
    } catch (error) {
      alert("Error submitting report. Please try again.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Welcome to the Dashboard</h2>
      {walletAddress ? (
        <p>
          Connected Wallet: <strong>{walletAddress}</strong>
        </p>
      ) : (
        <p style={{ color: "red" }}>Wallet not connected. Please login.</p>
      )}

      {/* Crime Report Submission Form */}
      <form onSubmit={handleReportSubmit} style={{ margin: "20px 0" }}>
        <textarea
          rows="4"
          cols="50"
          placeholder="Describe the crime incident..."
          value={crimeReport}
          onChange={(e) => setCrimeReport(e.target.value)}
          required
        />
        <br />
        <button type="submit" style={{ padding: "10px", marginTop: "10px", cursor: "pointer" }}>
          Submit Report
        </button>
      </form>

      {/* Displaying Previous Reports */}
      <h3>Submitted Reports</h3>
      {reports.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {reports.map((report) => (
            <li key={report._id} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0" }}>
              <p>
                <strong>Report ID:</strong> {report._id}
              </p>
              <p>{report.description}</p>
              <small>
                <strong>Status:</strong> {report.status}
              </small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No reports submitted yet.</p>
      )}
    </div>
  );
};

export default Dashboard;