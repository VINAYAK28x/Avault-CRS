const Web3 = require('web3');
const contractABI = require('../contracts/CrimeReport.json').abi;
require('dotenv').config();

class BlockchainService {
    constructor() {
        // Check for debug mode
        this.debugMode = process.env.DEBUG_MODE === 'true';
        if (this.debugMode) {
            console.log('⚠️ BLOCKCHAIN SERVICE RUNNING IN DEBUG MODE - OPERATIONS WILL BE SIMULATED');
            // In debug mode, still set up minimal properties but don't connect to blockchain
            this.web3 = null;
            this.contract = null;
            this.adminAccount = 'debug-account';
            return;
        }
        
        // Normal initialization
        // Get blockchain URL from environment or use fallback
        const blockchainUrl = process.env.BLOCKCHAIN_NODE_URL || 'http://localhost:8545';
        console.log(`Initializing blockchain service with URL: ${blockchainUrl}`);
        
        try {
            this.web3 = new Web3(blockchainUrl);
            
            // Verify contract address exists
            const contractAddress = process.env.CONTRACT_ADDRESS;
            if (!contractAddress) {
                console.warn('CONTRACT_ADDRESS not set in environment variables');
                throw new Error('CONTRACT_ADDRESS not set');
            }
            
            this.contract = new this.web3.eth.Contract(
                contractABI,
                contractAddress
            );
            
            // Verify admin account exists
            this.adminAccount = process.env.ADMIN_ACCOUNT;
            if (!this.adminAccount) {
                console.warn('ADMIN_ACCOUNT not set in environment variables');
                throw new Error('ADMIN_ACCOUNT not set');
            }

            // Set up account with private key if provided
            if (process.env.PRIVATE_KEY) {
                const account = this.web3.eth.accounts.privateKeyToAccount(
                    '0x' + process.env.PRIVATE_KEY.replace(/^0x/, '')
                );
                this.web3.eth.accounts.wallet.add(account);
                this.senderAddress = account.address;
                console.log(`Using account address from private key: ${this.senderAddress}`);
            } else {
                this.senderAddress = this.adminAccount;
                console.log(`Using admin account address: ${this.senderAddress}`);
            }
            
            console.log('Blockchain service initialized successfully');
        } catch (error) {
            console.error('Failed to initialize blockchain service:', error.message);
            // Don't throw here - we'll handle errors during operations
        }
    }

    async submitReport(title, reportType, description, location, evidenceHashes, timestamp) {
        // Debug mode simulation
        if (this.debugMode) {
            console.log('DEBUG MODE: Simulating blockchain submission for report:', { title, reportType });
            console.log('DEBUG MODE: Evidence hashes:', evidenceHashes);
            
            // Generate a fake transaction hash
            const fakeHash = 'debug-tx-' + Date.now().toString(16);
            const fakeReportId = Date.now().toString();
            
            return {
                success: true,
                reportId: fakeReportId,
                transactionHash: fakeHash,
                debug: true
            };
        }
        
        // Real blockchain operation
        try {
            console.log('Submitting report to blockchain with params:', {
                title,
                reportType,
                location,
                evidenceHashCount: evidenceHashes?.length || 0,
                timestamp
            });
            
            // Check if web3 is initialized
            if (!this.web3 || !this.contract) {
                throw new Error('Blockchain service not properly initialized');
            }
            
            // Check connection to blockchain
            try {
                const isConnected = await this.web3.eth.net.isListening();
                if (!isConnected) {
                    throw new Error('Not connected to blockchain network');
                }
                console.log('Connected to blockchain network');
                
                // Get network and chain information
                const networkId = await this.web3.eth.net.getId();
                console.log(`Connected to network ID: ${networkId}`);
                
                // Check if contract exists at the specified address
                const code = await this.web3.eth.getCode(this.contract.options.address);
                if (code === '0x' || code === '0x0') {
                    throw new Error(`No contract found at address ${this.contract.options.address}`);
                }
                console.log('Contract verified at address:', this.contract.options.address);
            } catch (connectionError) {
                console.error('Failed to connect to blockchain:', connectionError.message);
                throw new Error(`Failed to connect to blockchain: ${connectionError.message}`);
            }
            
            // Convert evidenceHashes to array if it's a string
            if (typeof evidenceHashes === 'string') {
                try {
                    evidenceHashes = JSON.parse(evidenceHashes);
                } catch (e) {
                    console.warn('Failed to parse evidenceHashes string, using as-is');
                }
            }
            
            // Ensure evidenceHashes is an array
            if (!Array.isArray(evidenceHashes)) {
                evidenceHashes = evidenceHashes ? [evidenceHashes] : [];
            }
            
            // Verify the account has sufficient balance
            const balance = await this.web3.eth.getBalance(this.senderAddress);
            console.log(`Account balance: ${this.web3.utils.fromWei(balance, 'ether')} ETH`);
            
            if (this.web3.utils.toBN(balance).isZero()) {
                throw new Error(`Account ${this.senderAddress} has no ETH for gas`);
            }
            
            // Check function exists in the contract
            if (!this.contract.methods.submitReport) {
                throw new Error('Contract does not have submitReport method');
            }
            
            // Log contract methods
            console.log('Available contract methods:', 
                Object.keys(this.contract.methods).filter(k => typeof this.contract.methods[k] === 'function')
            );
            
            // Estimate gas
            let gas;
            try {
                console.log('Estimating gas for transaction with parameters:');
                console.log('- Title:', title);
                console.log('- Type:', reportType);
                console.log('- Description length:', description ? description.length : 0);
                console.log('- Location:', location);
                console.log('- Evidence hashes:', JSON.stringify(evidenceHashes));
                console.log('- Timestamp:', timestamp);
                console.log('- From account:', this.senderAddress);
                
                gas = await this.contract.methods
                    .submitReport(title, reportType, description, location, evidenceHashes, timestamp)
                    .estimateGas({ from: this.senderAddress });
                console.log('Gas estimate:', gas);
            } catch (gasError) {
                console.error('Gas estimation failed:', gasError.message);
                throw new Error(`Gas estimation failed: ${gasError.message}`);
            }

            // Submit transaction
            console.log('Submitting transaction to blockchain...');
            const result = await this.contract.methods
                .submitReport(title, reportType, description, location, evidenceHashes, timestamp)
                .send({
                    from: this.senderAddress,
                    gas: Math.floor(gas * 1.5) // Add 50% buffer for safety
                });

            console.log('Transaction successful with hash:', result.transactionHash);
            console.log('Transaction receipt:', JSON.stringify(result, null, 2));
            
            // Look for the ReportSubmitted event to get the report ID
            let reportId = null;
            if (result.events && result.events.ReportSubmitted) {
                reportId = result.events.ReportSubmitted.returnValues.id;
                console.log('Report ID from event:', reportId);
            } else {
                // If we can't find the event, try to get the report ID from the logs
                console.log('No ReportSubmitted event found, looking through logs...');
                
                // Try to find the event in the logs
                for (const log of result.logs || []) {
                    console.log('Log:', log);
                    // Try to decode the log
                    try {
                        // Check if this is our event
                        if (log.topics && log.topics[0] === this.web3.utils.keccak256('ReportSubmitted(uint256,address)')) {
                            // Decode the event data
                            reportId = this.web3.eth.abi.decodeParameter('uint256', log.topics[1]);
                            console.log('Found report ID in logs:', reportId);
                            break;
                        }
                    } catch (e) {
                        console.warn('Failed to decode log:', e);
                    }
                }
                
                // If we still don't have a report ID, use a timestamp as fallback
                if (!reportId) {
                    reportId = Date.now().toString();
                    console.log('Using fallback report ID:', reportId);
                }
            }
            
            return {
                success: true,
                reportId: reportId,
                transactionHash: result.transactionHash
            };
        } catch (error) {
            console.error('Blockchain Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateReportStatus(reportId, status) {
        // Debug mode simulation
        if (this.debugMode) {
            console.log('DEBUG MODE: Simulating status update for report:', reportId, 'to status:', status);
            return {
                success: true,
                transactionHash: 'debug-status-tx-' + Date.now().toString(16),
                debug: true
            };
        }
        
        try {
            // Check if function exists in the contract
            if (!this.contract.methods.updateReportStatus) {
                console.warn('Contract does not have updateReportStatus method, trying alternative methods');
                
                // Try alternative methods that might exist
                if (this.contract.methods.updateStatus) {
                    console.log('Using updateStatus method instead');
                    const gas = await this.contract.methods
                        .updateStatus(reportId, status)
                        .estimateGas({ from: this.senderAddress });

                    const result = await this.contract.methods
                        .updateStatus(reportId, status)
                        .send({
                            from: this.senderAddress,
                            gas: Math.floor(gas * 1.5)
                        });

                    return {
                        success: true,
                        transactionHash: result.transactionHash
                    };
                }
                
                throw new Error('No suitable status update method found in contract');
            }
            
            const gas = await this.contract.methods
                .updateReportStatus(reportId, status)
                .estimateGas({ from: this.senderAddress });

            const result = await this.contract.methods
                .updateReportStatus(reportId, status)
                .send({
                    from: this.senderAddress,
                    gas: Math.floor(gas * 1.5)
                });

            return {
                success: true,
                transactionHash: result.transactionHash
            };
        } catch (error) {
            console.error('Blockchain Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getReport(reportId) {
        // Debug mode simulation
        if (this.debugMode) {
            console.log('DEBUG MODE: Simulating getReport for ID:', reportId);
            return {
                success: true,
                report: {
                    id: reportId,
                    title: 'Debug Report',
                    reportType: 'Other',
                    description: 'This is a simulated report in debug mode',
                    location: 'Debug Location',
                    evidenceHashes: [],
                    timestamp: Date.now().toString(),
                    reporter: 'debug-user-address',
                    status: 'Submitted'
                },
                debug: true
            };
        }
        
        try {
            // Check if function exists in the contract
            if (!this.contract.methods.getReport) {
                console.warn('Contract does not have getReport method, trying alternative methods');
                
                // Try alternative methods that might exist
                if (this.contract.methods.reports) {
                    console.log('Using reports mapping accessor instead');
                    const report = await this.contract.methods
                        .reports(reportId)
                        .call();
                        
                    return {
                        success: true,
                        report: {
                            id: reportId,
                            title: report.title || "",
                            reportType: report.reportType || "",
                            description: report.description || "",
                            location: report.location || "",
                            evidenceHashes: report.evidenceHashes || [],
                            timestamp: report.timestamp || "0",
                            reporter: report.reporter || "0x0000000000000000000000000000000000000000",
                            status: report.status || "Submitted"
                        }
                    };
                }
                
                throw new Error('No suitable report retrieval method found in contract');
            }
            
            const report = await this.contract.methods
                .getReport(reportId)
                .call();

            return {
                success: true,
                report: {
                    id: report.id,
                    title: report.title,
                    reportType: report.reportType,
                    description: report.description,
                    location: report.location,
                    evidenceHashes: report.evidenceHashes,
                    timestamp: report.timestamp,
                    reporter: report.reporter,
                    status: report.status
                }
            };
        } catch (error) {
            console.error('Blockchain Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Similar debug mode implementations for other methods
    async getUserReports(userAddress) {
        if (this.debugMode) {
            return {
                success: true,
                reportIds: ['debug-report-1', 'debug-report-2'],
                debug: true
            };
        }
        
        try {
            // Check if function exists in the contract
            if (!this.contract.methods.getUserReports) {
                console.warn('Contract does not have getUserReports method');
                return {
                    success: false,
                    error: 'Contract does not support getUserReports'
                };
            }
            
            const reportIds = await this.contract.methods
                .getUserReports(userAddress)
                .call();

            return {
                success: true,
                reportIds
            };
        } catch (error) {
            console.error('Blockchain Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getReportCount() {
        if (this.debugMode) {
            return {
                success: true,
                count: '0',
                debug: true
            };
        }
        
        try {
            // Check if function exists in the contract
            if (!this.contract.methods.getReportCount) {
                console.warn('Contract does not have getReportCount method');
                
                // Try alternative methods
                if (this.contract.methods.reportCount) {
                    console.log('Using reportCount accessor instead');
                    const count = await this.contract.methods
                        .reportCount()
                        .call();
                        
                    return {
                        success: true,
                        count
                    };
                }
                
                return {
                    success: false,
                    error: 'Contract does not support report counting'
                };
            }
            
            const count = await this.contract.methods
                .getReportCount()
                .call();

            return {
                success: true,
                count
            };
        } catch (error) {
            console.error('Blockchain Error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new BlockchainService(); 