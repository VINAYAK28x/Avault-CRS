const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function updateEnvFiles(contractAddress) {
    // Update backend .env
    const backendEnvPath = path.join(__dirname, '..', '.env');
    let backendEnvContent = '';
    try {
        backendEnvContent = fs.readFileSync(backendEnvPath, 'utf8');
    } catch (error) {
        console.log('Creating new backend .env file');
    }

    // Update frontend .env
    const frontendEnvPath = path.join(__dirname, '..', 'crs-frontend', '.env');
    let frontendEnvContent = '';
    try {
        frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
    } catch (error) {
        console.log('Creating new frontend .env file');
    }

    const contractAddressLine = `REACT_APP_CONTRACT_ADDRESS=${contractAddress}`;
    
    // Update frontend .env
    if (frontendEnvContent.includes('REACT_APP_CONTRACT_ADDRESS=')) {
        frontendEnvContent = frontendEnvContent.replace(/REACT_APP_CONTRACT_ADDRESS=.*/, contractAddressLine);
    } else {
        frontendEnvContent = frontendEnvContent + '\n' + contractAddressLine;
    }
    
    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log('Updated frontend .env file with new contract address');

    // Update backend .env
    if (backendEnvContent.includes('CONTRACT_ADDRESS=')) {
        backendEnvContent = backendEnvContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
    } else {
        backendEnvContent = backendEnvContent + '\nCONTRACT_ADDRESS=' + contractAddress;
    }
    
    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log('Updated backend .env file with new contract address');
}

async function main() {
    try {
        console.log("Starting deployment process...");
        console.log("Network:", hre.network.name);
        console.log("RPC URL:", hre.network.config.url);

        // Get the contract factory
        console.log("Getting contract factory...");
        const CrimeReport = await hre.ethers.getContractFactory("CrimeReport");

        // Deploy the contract
        console.log("Initiating contract deployment...");
        console.log("This may take a few minutes. Please wait for confirmations...");
        
        // Set deployment options with reduced gas settings
        const deploymentOptions = {
            gasLimit: 1500000, // Further reduced gas limit
            maxPriorityFeePerGas: hre.ethers.parseUnits("1.5", "gwei"), // Reduced priority fee
            maxFeePerGas: hre.ethers.parseUnits("35", "gwei") // Reduced max fee
        };

        console.log("Deployment options:", {
            gasLimit: deploymentOptions.gasLimit,
            maxPriorityFeePerGas: hre.ethers.formatUnits(deploymentOptions.maxPriorityFeePerGas, "gwei") + " gwei",
            maxFeePerGas: hre.ethers.formatUnits(deploymentOptions.maxFeePerGas, "gwei") + " gwei"
        });

        const crimeReport = await CrimeReport.deploy(deploymentOptions);
        const tx = crimeReport.deploymentTransaction();

        console.log("\nTransaction sent! Waiting for deployment...");
        console.log("Transaction hash:", tx.hash);
        console.log("Max fee per gas:", hre.ethers.formatUnits(tx.maxFeePerGas, "gwei"), "gwei");
        console.log("Max priority fee per gas:", hre.ethers.formatUnits(tx.maxPriorityFeePerGas, "gwei"), "gwei");
        console.log("Gas limit:", tx.gasLimit.toString());

        // Wait for deployment to complete with shorter timeout
        console.log("\nWaiting for deployment confirmation...");
        console.log("This will timeout after 5 minutes if not confirmed");
        
        const receipt = await Promise.race([
            tx.wait(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Deployment timeout after 5 minutes")), 300000)
            )
        ]);
        
        console.log("Deployment confirmed in block:", receipt.blockNumber);
        console.log("Gas used:", receipt.gasUsed.toString());
        if (receipt.effectiveGasPrice) {
            console.log("Effective gas price:", hre.ethers.formatUnits(receipt.effectiveGasPrice, "gwei"), "gwei");
        }
        
        const contractAddress = await crimeReport.getAddress();
        console.log("\nCrimeReport deployed successfully!");
        console.log("Contract address:", contractAddress);
        
        // Update .env files with contract address
        await updateEnvFiles(contractAddress);
        
        // Wait for just 1 block confirmation
        console.log("\nWaiting for 1 block confirmation...");
        await new Promise(resolve => setTimeout(resolve, 15000)); // Wait for ~1 block on Sepolia
        
        console.log("Deployment fully confirmed!");
        console.log("Contract address:", contractAddress);
        console.log("\nVerify on Etherscan with:");
        console.log(`npx hardhat verify --network sepolia ${contractAddress}`);

        return contractAddress;
    } catch (error) {
        console.error("\nDeployment failed!");
        console.error("Error details:", error);
        if (error.transaction) {
            console.error("Transaction hash:", error.transaction.hash);
            console.error("Max fee per gas:", error.transaction.maxFeePerGas);
            console.error("Max priority fee per gas:", error.transaction.maxPriorityFeePerGas);
            console.error("Gas limit:", error.transaction.gasLimit);
        }
        if (error.code === 'NETWORK_ERROR') {
            console.error("\nNetwork error detected. Please check your internet connection and RPC endpoint.");
        }
        throw error;
    }
}

main()
    .then((address) => {
        console.log("\nDeployment completed successfully!");
        console.log("Contract address:", address);
        process.exit(0);
    })
    .catch((error) => {
        console.error("\nDeployment failed!");
        console.error("Error details:", error);
        process.exit(1);
    }); 