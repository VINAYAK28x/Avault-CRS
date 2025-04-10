import React, { useState } from "react";

const ReportForm = () => {
  const [crimeType, setCrimeType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Store selected file
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simple validation
    if (!crimeType || !location || !description) {
      setErrorMessage("All fields are required.");
      return;
    }

    const reportData = {
      crimeType,
      location,
      description,
      file: file ? file.name : "No file uploaded",
    };

    console.log("Report Submitted:", reportData);
    alert("Crime report submitted successfully!");

    // Clear form after submission
    setCrimeType("");
    setLocation("");
    setDescription("");
    setFile(null);
    setErrorMessage("");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "auto", padding: "20px" }}>
      <h2>Submit a Crime Report</h2>
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      <form onSubmit={handleSubmit}>
        <label>Crime Type:</label>
        <input
          type="text"
          value={crimeType}
          onChange={(e) => setCrimeType(e.target.value)}
          placeholder="Enter crime type"
          required
        />

        <label>Location:</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location"
          required
        />

        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the incident"
          required
        ></textarea>

        <label>Upload Evidence (Optional):</label>
        <input type="file" onChange={handleFileChange} />

        <button type="submit">Submit Report</button>
      </form>
    </div>
  );
};

export default ReportForm;
