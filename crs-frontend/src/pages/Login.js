import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import api from "../api";

const Login = () => {
    const [walletAddress, setWalletAddress] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const navigate = useNavigate();

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                setWalletAddress(accounts[0]);
                setErrorMessage("");
            } catch (error) {
                setErrorMessage("Failed to connect wallet.");
            }
        } else {
            setErrorMessage("MetaMask is not installed.");
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!walletAddress) {
            setErrorMessage("Please connect your MetaMask wallet.");
            return;
        }

        try {
            const response = await api.post("/auth/login", { walletId: walletAddress, password });
            localStorage.setItem("token", response.data.token);
            alert("Login successful!");
            navigate("/dashboard");
        } catch (error) {
            setErrorMessage("Error logging in: " + error.response?.data?.message);
        }
    };

    return (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>Login with MetaMask</h2>
            <button onClick={connectWallet} style={{ padding: "10px", cursor: "pointer" }}>
                {walletAddress ? "Wallet Connected" : "Connect MetaMask"}
            </button>
            {walletAddress && <p>Wallet Address: {walletAddress}</p>}
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            <form onSubmit={handleLogin} style={{ marginTop: "20px" }}>
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
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;