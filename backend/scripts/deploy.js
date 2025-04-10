const hre = require("hardhat");

async function main() {
    console.log("Deploying CrimeReport...");
    
    const CrimeReport = await hre.ethers.getContractFactory("CrimeReport");
    const crimeReport = await CrimeReport.deploy();
    await crimeReport.waitForDeployment();
    
    const address = await crimeReport.getAddress();
    console.log("CrimeReport deployed to:", address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 