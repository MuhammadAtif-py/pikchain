# PhotoBlock Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js v18+
- MetaMask browser extension
- Git

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env.local`:
```bash
copy .env.example .env.local
```

Edit `.env.local` with your settings:
```env
# For local development (no API costs)
VITE_USE_LOCAL_IPFS=true

# For production (real IPFS via Pinata)
# VITE_USE_LOCAL_IPFS=false
# VITE_PINATA_API_KEY=your_pinata_api_key
# VITE_PINATA_API_SECRET=your_pinata_secret

# Supabase (optional - for user auth & audit logs)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Start Services (3 Terminals)

**Terminal 1 - Blockchain:**
```bash
npx hardhat node
```

**Terminal 2 - Deploy Contract:**
```bash
npx hardhat run scripts/deploy-local.cjs --network localhost
```

**Terminal 3 - Local IPFS Server:**
```bash
node scripts/local-ipfs-server.cjs
```

**Terminal 4 - Dev Server:**
```bash
npm run dev
```

### Step 4: Configure MetaMask

1. Open MetaMask
2. Add Network:
   - **Network Name:** Localhost
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Symbol:** ETH

3. Import Test Account (has 10,000 ETH):
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

### Step 5: Open App
Navigate to: http://localhost:5173

---

## Production Deployment

### Option A: Deploy to Polygon Amoy Testnet

1. **Get Test MATIC:**
   - Go to https://faucet.polygon.technology/
   - Request MATIC for Amoy testnet

2. **Configure `.env`:**
   ```env
   VITE_USE_LOCAL_IPFS=false
   VITE_PINATA_API_KEY=your_key
   VITE_PINATA_API_SECRET=your_secret
   PRIVATE_KEY=your_wallet_private_key
   ```

3. **Deploy Contract:**
   ```bash
   npx hardhat run scripts/deploy.js --network amoy
   ```

4. **Update Config:**
   Copy the deployed contract address to `src/contract/Config.json`

### Option B: Deploy Frontend to Vercel/Netlify

1. **Build:**
   ```bash
   npm run build
   ```

2. **Deploy `dist` folder** to your hosting provider

3. **Set Environment Variables** in hosting dashboard:
   - `VITE_USE_LOCAL_IPFS=false`
   - `VITE_PINATA_API_KEY=xxx`
   - `VITE_PINATA_API_SECRET=xxx`
   - `VITE_SUPABASE_URL=xxx`
   - `VITE_SUPABASE_ANON_KEY=xxx`

---

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Vite Dev Server | 5173 | Frontend |
| Hardhat Node | 8545 | Local blockchain |
| Local IPFS Server | 3001 | File storage (dev only) |

---

## Troubleshooting

### "Internal JSON-RPC Error"
- **Cause:** MetaMask can't connect to blockchain
- **Fix:** 
  1. Ensure Hardhat node is running (`npx hardhat node`)
  2. Reset MetaMask account: Settings → Advanced → Clear Activity Tab Data
  3. Switch to correct network (Localhost 8545)

### "Parse Error: Unexpected end of JSON input"
- **Cause:** Local IPFS server not running
- **Fix:** Start the server: `node scripts/local-ipfs-server.cjs`

### "Contract not deployed" / "Calling an account which is not a contract"
- **Cause:** Hardhat was restarted (blockchain reset)
- **Fix:** Redeploy: `npx hardhat run scripts/deploy-local.cjs --network localhost`

### Images not loading in Gallery
- **Cause:** Local IPFS server not running OR invalid CID
- **Fix:** 
  1. Start IPFS server
  2. Upload new images (old CIDs won't exist after restart)

### MetaMask "Nonce too high"
- **Cause:** MetaMask cached old transactions
- **Fix:** Reset account in MetaMask: Settings → Advanced → Clear Activity Tab Data

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                       │
│                    http://localhost:5173                     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
│   Hardhat Node  │  │ Local IPFS  │  │    Supabase     │
│   (Blockchain)  │  │   Server    │  │   (Database)    │
│   Port: 8545    │  │  Port: 3001 │  │    (Cloud)      │
└─────────────────┘  └─────────────┘  └─────────────────┘
        │                   │                  │
        │                   │                  │
        ▼                   ▼                  ▼
 ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
 │  Contract   │    │ .local-ipfs │    │ audit_logs  │
 │  Storage    │    │   folder    │    │  profiles   │
 └─────────────┘    └─────────────┘    └─────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/contract/Config.json` | Contract addresses per network |
| `src/contract/Abi.json` | Contract ABI |
| `scripts/deploy-local.cjs` | Local deployment script |
| `scripts/local-ipfs-server.cjs` | Mock IPFS server |
| `.env.local` | Environment variables |
| `hardhat.config.cjs` | Hardhat configuration |

---

## Networks Supported

| Network | Chain ID | Contract Address |
|---------|----------|------------------|
| Localhost (Hardhat) | 31337 | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| Polygon Amoy | 80002 | `0x928cD9A5a8129D554F98104fF4a62f1D8aD01254` |

---

## Commands Cheatsheet

```bash
# Development
npm run dev              # Start frontend
npx hardhat node         # Start local blockchain
npx hardhat run scripts/deploy-local.cjs --network localhost  # Deploy
node scripts/local-ipfs-server.cjs  # Start IPFS server

# Production
npm run build            # Build for production
npx hardhat run scripts/deploy.js --network amoy  # Deploy to testnet

# Utilities
npx hardhat compile      # Compile contracts
npx hardhat clean        # Clean build artifacts
```

---

## Security Notes

⚠️ **Never commit `.env.local` or `.env` files!**

⚠️ **Never use Hardhat test private keys on mainnet!**

⚠️ **Always use environment variables for sensitive data.**

---

## Support

- GitHub: https://github.com/dcryptoniun/
- Documentation: See `METHODOLOGY.md` and `DATABASE_SCHEMA.md`
