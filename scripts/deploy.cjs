const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting PhotoBlock contract deployment to Polygon Amoy...");
  
  // Get the ContractFactory and Signers
  const PhotoBlock = await hre.ethers.getContractFactory("photoblock");
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📝 Deploying contract with account:", await deployer.getAddress());
  console.log("💰 Account balance:", (await hre.ethers.provider.getBalance(await deployer.getAddress())).toString());
  
  // Deploy the contract
  console.log("🔨 Deploying PhotoBlock contract...");
  const photoblock = await PhotoBlock.deploy();
  
  // Wait for deployment to complete
  await photoblock.waitForDeployment();
  
  const contractAddress = await photoblock.getAddress();
  
  console.log("✅ PhotoBlock contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("🔗 View on Polygonscan:", `https://amoy.polygonscan.com/address/${contractAddress}`);
  
  // Update the config file
  console.log("📝 Updating Config.json with new contract address...");
  
  const fs = require('fs');
  const path = require('path');
  
  const configPath = path.join(__dirname, '../src/contract/Config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Add Polygon Amoy network configuration
  config.NETWORKS["80002"] = {
    "CONTRACT_ADDRESS": contractAddress,
    "SCAN_LINK": `https://amoy.polygonscan.com/address/${contractAddress}`,
    "NETWORK_NAME": "Polygon Amoy"
  };
  
  // Update default addresses to use Amoy
  config.CONTRACT_ADDRESS = contractAddress;
  config.SCAN_LINK = `https://amoy.polygonscan.com/address/${contractAddress}`;
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log("✅ Config.json updated successfully!");
  console.log("\n🎉 Deployment completed! Your contract is ready to use on Polygon Amoy.");
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
