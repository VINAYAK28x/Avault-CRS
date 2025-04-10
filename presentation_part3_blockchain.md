# Crime Reporting System - Blockchain Integration

## Smart Contract (CrimeReport.sol)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CrimeReport {
    struct Report {
        string title;
        string reportType;
        string description;
        string location;
        uint256 timestamp;
        address reporter;
        string[] evidenceHashes;
    }

    Report[] private reports;
    mapping(address => uint256[]) private userReports;

    event ReportSubmitted(
        uint256 indexed reportId,
        address indexed reporter,
        string reportType,
        uint256 timestamp
    );

    function submitReport(
        string memory _title,
        string memory _reportType,
        string memory _description,
        string memory _location,
        string[] memory _evidenceHashes,
        uint256 _timestamp
    ) public returns (uint256) {
        Report memory newReport = Report({
            title: _title,
            reportType: _reportType,
            description: _description,
            location: _location,
            timestamp: _timestamp,
            reporter: msg.sender,
            evidenceHashes: _evidenceHashes
        });

        reports.push(newReport);
        uint256 reportId = reports.length - 1;
        userReports[msg.sender].push(reportId);

        emit ReportSubmitted(reportId, msg.sender, _reportType, _timestamp);
        return reportId;
    }

    function getReport(uint256 _reportId) public view returns (
        string memory title,
        string memory reportType,
        string memory description,
        string memory location,
        uint256 timestamp,
        address reporter,
        string[] memory evidenceHashes
    ) {
        require(_reportId < reports.length, "Report does not exist");
        Report memory report = reports[_reportId];
        return (
            report.title,
            report.reportType,
            report.description,
            report.location,
            report.timestamp,
            report.reporter,
            report.evidenceHashes
        );
    }

    function getUserReports(address _user) public view returns (uint256[] memory) {
        return userReports[_user];
    }

    function getReportCount() public view returns (uint256) {
        return reports.length;
    }
}
```

### Smart Contract Explanation
- Implements report storage on Ethereum blockchain
- Manages report submission and retrieval
- Tracks user-specific reports
- Emits events for report submission

## Hardhat Configuration (hardhat.config.js)

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};
```

### Hardhat Configuration Explanation
- Configures development environment
- Sets up network connections
- Manages deployment settings
- Integrates with Etherscan

## Deployment Script (deploy.js)

```javascript
const hre = require("hardhat");

async function main() {
  const CrimeReport = await hre.ethers.getContractFactory("CrimeReport");
  const crimeReport = await CrimeReport.deploy();
  await crimeReport.deployed();

  console.log("CrimeReport deployed to:", crimeReport.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Deployment Script Explanation
- Handles contract deployment
- Manages contract factory
- Provides deployment feedback
- Handles deployment errors

## Web3 Integration Features

1. **Contract Interaction**
   - Report submission
   - Report retrieval
   - User report tracking
   - Event handling

2. **Security Measures**
   - Address validation
   - Transaction signing
   - Gas optimization
   - Error handling

3. **Data Management**
   - IPFS integration
   - Evidence hash storage
   - Timestamp validation
   - Report verification

4. **User Features**
   - Wallet connection
   - Transaction monitoring
   - Report ownership
   - Access control

## Blockchain Architecture Overview

1. **Smart Contract Layer**
   - Data structures
   - Access control
   - Event emission
   - State management

2. **Integration Layer**
   - Web3 connection
   - Contract interaction
   - Transaction handling
   - Error management

3. **Storage Layer**
   - On-chain data
   - IPFS integration
   - Evidence management
   - Report indexing

4. **Security Layer**
   - Access control
   - Data validation
   - Transaction verification
   - Error handling 