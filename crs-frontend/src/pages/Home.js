import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { checkAdminExists } from "../api";

const Home = () => {
  const [adminExists, setAdminExists] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const exists = await checkAdminExists();
        setAdminExists(exists);
      } catch (error) {
        console.error("Error checking admin:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Crime Reporting System</h1>
        <p>A secure, anonymous, and tamper-proof way to report crimes.</p>
      </header>

      <section style={styles.section}>
        <h2>Why Use Our Platform?</h2>
        <p>
          Our blockchain-powered crime reporting system ensures anonymity, security, and transparency. 
          Report incidents safely and track their status in real-time.
        </p>
      </section>

      <section style={styles.buttonSection}>
        <h2>Get Started</h2>
        <div>
          <Link to="/signup" style={styles.button}>Sign Up</Link>
          <Link to="/login" style={styles.button}>Login</Link>
          <Link to="/dashboard" style={styles.button}>Go to Dashboard</Link>
          {!loading && !adminExists && (
            <Link to="/admin/setup" style={{...styles.button, backgroundColor: '#dc3545'}}>
              Admin Setup
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

// Styling
const styles = {
  container: {
    textAlign: "center",
    padding: "30px",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "20px",
  },
  section: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    maxWidth: "600px",
    margin: "20px auto",
  },
  buttonSection: {
    marginTop: "30px",
  },
  button: {
    display: "inline-block",
    padding: "10px 20px",
    margin: "10px",
    backgroundColor: "#007bff",
    color: "white",
    textDecoration: "none",
    borderRadius: "5px",
  }
};

export default Home;
