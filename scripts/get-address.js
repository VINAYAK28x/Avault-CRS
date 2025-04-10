const { ethers } = require("hardhat");

async function main() {
    const wallet = new ethers.Wallet("52acd2bb2715b9101a2d23c48917996e1ad9be4ccf8f5d992453c478f8bfc9c2");
    console.log("Your wallet address:", wallet.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 