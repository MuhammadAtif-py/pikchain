#!/usr/bin/env node
const { spawn } = require('child_process');
const { ethers } = require('ethers');

const RPC_URL = process.env.LOCAL_RPC_URL || 'http://127.0.0.1:8545';
const MAX_RETRIES = Number(process.env.DEPLOY_RETRY_COUNT || 30);
const RETRY_DELAY_MS = Number(process.env.DEPLOY_RETRY_DELAY || 1000);

async function waitForNode() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await provider.getBlockNumber();
      console.log(`⚙️  Hardhat node detected at ${RPC_URL} (attempt ${attempt})`);
      return true;
    } catch (err) {
      if (attempt === 1) {
        console.log(`⏳ Waiting for Hardhat node at ${RPC_URL}...`);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  console.error(`❌ Unable to connect to Hardhat RPC at ${RPC_URL} after ${MAX_RETRIES} attempts.`);
  return false;
}

(async () => {
  const ready = await waitForNode();
  if (!ready) {
    process.exit(1);
    return;
  }

  console.log('🚀 Running local deployment...');
  const deploy = spawn('npx', ['hardhat', 'run', 'scripts/deploy-local.cjs', '--network', 'localhost'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  deploy.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Local contract deployment finished.');
    } else {
      console.error(`❌ Local deployment exited with code ${code}.`);
    }
    process.exit(code);
  });
})();
