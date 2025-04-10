import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import api from "../api";

const Signup = () => {
  const [walletAddress, setWalletAddress] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setWalletAddress(accounts[0]); // Store the wallet address
        setErrorMessage(""); // Clear any previous errors
      } catch (error) {
        console.error("MetaMask connection failed:", error);
        setErrorMessage("Failed to connect. Make sure MetaMask is unlocked.");
      }
    } else {
      setErrorMessage("MetaMask is not installed. Please install it from https://metamask.io/download/");
    }
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!walletAddress) {
      setErrorMessage("Please connect your MetaMask wallet.");
      return;
    }

    try {
      const response = await api.post("/auth/signup", { walletId: walletAddress, password });
      alert("Signup successful! Please log in.");
      navigate("/login");
    } catch (error) {
      setErrorMessage("Error signing up: " + (error.response?.data?.message || "Server error"));
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h2>Signup with MetaMask</h2>
      
      {/* Connect MetaMask Button */}
      <button onClick={connectWallet} style={{ padding: "10px", margin: "10px", cursor: "pointer" }}>
        {walletAddress ? "Wallet Connected" : "Connect MetaMask"}
      </button>

      {/* Show Wallet Address */}
      {walletAddress && <p>Wallet Address: {walletAddress}</p>}

      {/* Show Errors */}
      {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}

      {/* Signup Form */}
      <form onSubmit={handleSignup} style={{ marginTop: "20px" }}>
        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "8px", marginBottom: "10px" }}
        />
        <br />
        <button type="submit" style={{ padding: "10px", cursor: "pointer" }}>
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default Signup;
