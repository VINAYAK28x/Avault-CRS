import Web3 from 'web3';

// Contract ABI - this defines the contract's interface
export const CRIME_REPORT_ABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "reportId",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "reporter",
                "type": "address"
            }
        ],
        "name": "ReportSubmitted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "status",
                "type": "string"
            }
        ],
        "name": "ReportStatusUpdated",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_reportId",
                "type": "uint256"
            }
        ],
        "name": "getReport",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "id",
                        "type": "uint256"
                    },
                    {
                        "internalType": "string",
                        "name": "title",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "reportType",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "description",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "location",
                        "type": "string"
                    },
                    {
                        "internalType": "string[]",
                        "name": "evidenceHashes",
                        "type": "string[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "timestamp",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "reporter",
                        "type": "address"
                    }
                ],
                "internalType": "struct CrimeReport.Report",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getReportCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_user",
                "type": "address"
            }
        ],
        "name": "getUserReports",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_title",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_reportType",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_description",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_location",
                "type": "string"
            },
            {
                "internalType": "string[]",
                "name": "_evidenceHashes",
                "type": "string[]"
            },
            {
                "internalType": "uint256",
                "name": "_timestamp",
                "type": "uint256"
            }
        ],
        "name": "submitReport",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_reportId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_status",
                "type": "string"
            }
        ],
        "name": "updateReportStatus",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Contract configuration
export const CONTRACT_CONFIG = {
    address: process.env.REACT_APP_CONTRACT_ADDRESS,
    network: process.env.REACT_APP_BLOCKCHAIN_NETWORK || 'sepolia'
};

// Initialize Web3 with the provider
export const getWeb3 = () => {
    if (typeof window.ethereum !== 'undefined') {
        return new Web3(window.ethereum);
    }
    throw new Error('Please install MetaMask to use this feature');
};

// Get contract instance
export const getContract = async () => {
    const web3 = getWeb3();
    const networkId = await web3.eth.net.getId();
    
    if (!CONTRACT_CONFIG.address) {
        throw new Error('Contract address not configured');
    }

    return new web3.eth.Contract(
        CRIME_REPORT_ABI,
        CONTRACT_CONFIG.address
    );
};

// IPFS Configuration
export const IPFS_CONFIG = {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: `Basic ${Buffer.from(
            `${process.env.REACT_APP_INFURA_PROJECT_ID}:${process.env.REACT_APP_INFURA_PROJECT_SECRET}`
        ).toString('base64')}`,
    },
}; 