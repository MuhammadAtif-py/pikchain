# PhotoBlock (Pikchain)

A decentralized photo storage platform using blockchain technology and IPFS for secure, immutable image storage with verification capabilities.

## 🌟 Features

- **Decentralized Storage** - Images stored on IPFS, CIDs stored on blockchain
- **Multi-Network Support** - Works on Localhost (Hardhat) and Polygon Amoy
- **Local Development** - Full offline mode with local IPFS server (no API costs!)
- **Smart Caching** - RPC error resilience with localStorage fallback
- **QR Verification** - Generate QR codes for photo verification
- **Download Support** - Download images with gateway fallback
- **User Profiles** - Set usernames stored on-chain

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | TailwindCSS |
| Web3 | wagmi 0.12.x + ethers 5.7.2 |
| Blockchain | Hardhat (local) / Polygon Amoy (testnet) |
| Storage | IPFS (Pinata / Local Server) |
| Database | Supabase (optional - auth & audit logs) |

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MetaMask browser extension

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Services (3 Terminals)

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

**Terminal 4 - Frontend:**
```bash
npm run dev
```

### 3. Configure MetaMask

1. Add Network:
   - **Network Name:** Localhost 8545
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Symbol:** ETH

2. Import Test Account:
   ```
   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

### 4. Open App
http://localhost:5173

## 📁 Project Structure

```
photoblock/
├── src/
│   ├── component/          # React components
│   │   ├── Upload.jsx      # Photo upload + IPFS
│   │   ├── Gallery.jsx     # Photo gallery with caching
│   │   ├── Profile.jsx     # User profile display
│   │   └── Settings.jsx    # Username settings
│   ├── pages/              # Route pages
│   │   ├── Verify.jsx      # Photo verification
│   │   ├── Explorer.jsx    # Blockchain explorer
│   │   └── Analytics.jsx   # Usage analytics
│   ├── utils/
│   │   ├── cache.js        # LocalStorage caching
│   │   ├── contract.js     # Contract helpers
│   │   └── txHistory.js    # Transaction tracking
│   └── contract/
│       ├── Contract.sol    # Smart contract
│       ├── Abi.json        # Contract ABI
│       └── Config.json     # Network config
├── scripts/
│   ├── deploy-local.cjs    # Local deployment
│   └── local-ipfs-server.cjs # Dev IPFS server
└── hardhat.config.cjs      # Hardhat config
```

## 🔧 Environment Variables

Create `.env.local`:
```env
# Local Development (recommended)
VITE_USE_LOCAL_IPFS=true

# Production (Pinata)
VITE_USE_LOCAL_IPFS=false
VITE_PINATA_API_KEY=your_key
VITE_PINATA_API_SECRET=your_secret

# Optional - Supabase
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

## 🌐 Networks

| Network | Chain ID | Contract |
|---------|----------|----------|
| Localhost | 31337 | Auto-deployed |
| Polygon Amoy | 80002 | `0x928cD9A5a8129D554F98104fF4a62f1D8aD01254` |

## 📖 Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Architecture Diagrams](ARCHITECTURE_DIAGRAMS.md)
- [Methodology](METHODOLOGY.md)
- [Database Schema](DATABASE_SCHEMA.md)

## 🔒 Security

- All photos are content-addressed (CID = hash of content)
- On-chain storage ensures immutability
- User data isolated by wallet address
- Local caching for RPC error resilience

## 📄 License

MIT