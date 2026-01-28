const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting PhotoBlock contract deployment to LOCAL network...");
  
  // Get the ContractFactory and Signers
  const PhotoBlock = await hre.ethers.getContractFactory("photoblock");
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📝 Deploying contract with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());
  
  // Deploy the contract
  console.log("🔨 Deploying PhotoBlock contract...");
  const photoblock = await PhotoBlock.deploy();
  
  // Wait for deployment to complete (ethers v5 uses deployed())
  await photoblock.deployed();
  
  const contractAddress = photoblock.address;
  
  console.log("✅ PhotoBlock contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  
  // Update the config file for localhost
  console.log("📝 Updating Config.json with local contract address...");
  
  const configPath = path.join(__dirname, '../src/contract/Config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Add localhost network configuration (chainId 31337 is Hardhat default)
  const localNetworkEntry = {
    "CONTRACT_ADDRESS": contractAddress,
    "SCAN_LINK": "",
    "NETWORK_NAME": "Localhost (Hardhat)"
  };

  config.NETWORKS["31337"] = localNetworkEntry;
  config.NETWORKS["1337"] = localNetworkEntry;
  
  // Update default addresses to use localhost for development
  config.CONTRACT_ADDRESS = contractAddress;
  config.SCAN_LINK = "";
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log("✅ Config.json updated successfully!");
  console.log("\n🎉 Local deployment completed!");
  console.log("\n📋 Next steps:");
  console.log("   1. Import Hardhat account #0 to MetaMask:");
  console.log("      Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
  console.log("   2. Add network to MetaMask:");
  console.log("      Network Name: Localhost 8545");
  console.log("      RPC URL: http://127.0.0.1:8545");
  console.log("      Chain ID: 31337");
  console.log("      Currency Symbol: ETH");
  console.log("   3. Start the frontend: npm run dev");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
