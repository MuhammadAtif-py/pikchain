# PhotoBlock Project Methodology

> Comprehensive project document describing the design rationale, implementation methodology, operational procedures, and future roadmap for PhotoBlock (Pikchain) — a decentralized photo archival and verification system.

---

## 1. Executive Summary
- PhotoBlock delivers a tamper-evident registry for photographs by storing image content on IPFS and recording immutable ownership proofs on Polygon Amoy.
- The solution couples a robust React-based client with smart contract infrastructure, transaction analytics, and optional Supabase audit logging to achieve transparency and accountability for media uploads.
- This document formalises the project methodology for academic submission, stakeholder review, and engineering hand-off.

## 2. Introduction
### 2.1 Background
Digital photographs are frequently altered or misattributed, making provenance verification difficult. Decentralized storage and blockchain records provide a deterministic way to preserve originality and provenance.

### 2.2 Problem Statement
- Users lack an accessible workflow to publish images and simultaneously secure irrefutable ownership proofs.
- Existing centralized galleries can modify or remove content, while pure blockchain storage is cost prohibitive for rich media.

### 2.3 Proposed Solution
PhotoBlock bridges these concerns by:
- Pinning images to IPFS through Pinata or a local gateway (development mode).
- Persisting the resulting CID alongside the uploader’s wallet address on a smart contract deployed to Polygon Amoy.
- Providing verification surfaces (QR codes, explorer views) so third parties can independently validate ownership without intermediaries.

## 3. Project Objectives and Success Criteria
- **Functional objectives**
   - Allow authenticated wallet users to upload images, record their CIDs on-chain, and view/download them later.
   - Provide a verification page where any CID can be cross-checked against a claimed address.
- **Operational objectives**
   - Maintain reliable behaviour when RPC nodes restart or IPFS gateways stall via caching and fallback techniques.
   - Offer analytics and transaction histories without altering the deployed contract ABI.
- **Success criteria**
   - 100% of successful uploads yield a CID stored on-chain and retrievable through the gallery and verification pages.
   - Transaction status is visible end-to-end (pending, confirming, success/failure) within the user interface.
   - Project can be setup from scratch with documented scripts and environment variables.

## 4. System Requirements
### 4.1 Functional Requirements
- FR1: Users must connect an EVM-compatible wallet (MetaMask) to interact with PhotoBlock.
- FR2: Users must be able to upload images and obtain CIDs from the configured IPFS pinning service.
- FR3: Users must be able to commit CIDs to the smart contract and view them in their gallery.
- FR4: The system must provide transaction history, analytics dashboards, and verification utilities.
- FR5: Optional Supabase integration must log security-sensitive events (login, wallet link, photo actions).

### 4.2 Non-Functional Requirements
- **Performance:** Gallery must render cached CIDs within 1s, falling back to live RPC reads when available.
- **Resilience:** Application must continue to operate when RPC endpoints are briefly unavailable, using cache fallbacks.
- **Security:** Private keys remain client-side; contract functions rely on `msg.sender` checks; audit entries capture sensitive operations when Supabase configured.
- **Scalability:** Architecture should remain stable for dozens of concurrent wallet sessions; IPFS/Polygon provide horizontal scalability.
- **Maintainability:** Codebase follows modular React components and utilities; configuration is managed through `.env` files and JSON contract descriptors.

## 5. Architectural Overview
### 5.1 Layered Architecture
- **Client Layer:** React (Vite) SPA using Tailwind, React Router, wagmi hooks, and toast notifications.
- **Smart Contract Layer:** Solidity contract storing usernames and CID arrays keyed by address.
- **Storage Layer:** IPFS (Pinata / local gateway) for binary objects; localStorage + Supabase for metadata.
- **Integration Layer:** Hardhat scripts for deployment, Axios for IPFS uploads, ethers for RPC communication.

### 5.2 Component View
- **Dashboard Module:** Aggregates Upload, Gallery, and Transaction History widgets.
- **Analytics Module:** Uses `recharts` to visualise upload trends, counts, and gas usage.
- **Explorer Module:** Queries recent Amoy blocks for educational transparency.
- **Verification Module:** Confirms whether a given CID is registered under a wallet.
- **Settings Module:** Allows profile edits, wallet linking, and cache invalidation.

### 5.3 Deployment View
- **Development environment:** Hardhat local chain (31337/1337), optional local IPFS server, Vite dev server.
- **Testnet environment:** Polygon Amoy RPC, Pinata IPFS, Supabase backend.
- **Build artifacts:** Vite bundles output to `dist/`, ready for static hosting.

## 6. Detailed Module Methodology
### 6.1 Smart Contract Module
- **Operational notes:**
   - `addCID` writes are O(1) but append-only; pruning requires future contract iteration.
   - Username updates overwrite the existing string without emitting events; the UI therefore caches the latest value client-side.
   - Since Solidity 0.8+ has built-in overflow checks, no additional SafeMath constructs are required.
   - Gas estimation uses wagmi’s prepare hook; failures typically indicate chain mismatch or missing deployment.

### 6.2 Upload Pipeline Module
- **Error handling:**
   - HTTP 4xx/5xx responses surface toast errors and are logged through the debug logger.
   - Network failures trigger retries only when the user manually reattempts; automatic retries are deferred to avoid duplicate uploads.
   - When Pinata credentials are absent, the pipeline urges the developer to enable `VITE_USE_LOCAL_IPFS` for offline testing.
- **Performance considerations:**
   - File objects remain in memory only until a successful CID is returned; `setFile(null)` occurs after a confirmed chain save to free memory.
   - Upload button disables while a transfer is in flight to prevent multiple concurrent submissions.

### 6.3 Transaction Lifecycle Module
- **Advanced behaviours:**
   - Pending transactions persist across page reloads because hashes are written to localStorage before confirmation.
   - When the provider throws due to a dropped block, the watcher retries once before marking the transaction as “unknown”; users can then force-refresh history.
   - Gas usage is stored as a string (to avoid bigint serialisation issues) and converted back to numbers only when rendering metrics.


- **Accessibility considerations:**
   - Image elements include `alt` text referencing truncated CIDs for screen readers.
   - Buttons have keyboard focus states and tooltips describing the action (download, refresh, QR).
- **Data hygiene:**
   - CIDs are trimmed before comparison to avoid whitespace discrepancies.
   - Duplicate detection uses a frequency map to display occurrence badges while retaining the original order for visual familiarity.
- **UX fallbacks:** When contract code not deployed, the gallery displays guidance to run auto-deploy scripts.

- **Calculation details:**
   - The seven-day window is computed using local time for human readability; future work may standardise to UTC for cross-region comparability.
   - Gas totals sum only transactions with `status === 'success'`; failed transactions are counted separately for reliability diagnostics.
   - Metadata includes block timestamps which are converted to human-readable format with `Intl.DateTimeFormat` respecting user locale.

- **Visualisation:** `recharts` line chart; cards for summary metrics; recalculates when history cache invalidated.
- **Security posture:**
   - JWT tokens persist via Supabase’s session management; refresh tokens auto-renew while respecting browser storage policies.
   - Audit entries capture `user_agent`, IP metadata (when available), and contextual payloads to aid forensic reviews.
   - Sensitive operations (password reset, wallet link) require existing sessions; unauthenticated calls short-circuit with descriptive errors.
- **Auth context:** `src/context/AuthContext.jsx` manages session state, profile fetching, password management, and wallet linking.
- **Audit logging:** `src/services/auditService.js` inserts structured records into `audit_logs`; gracefully degrades to console logs when Supabase absent.

## 7. Data Flow Methodology
1. **Upload request:** User selects file → Upload component posts FormData → IPFS returns CID.
2. **CID staging:** CID stored in component state and local transaction draft.
3. **Blockchain commit:** `addCID` sends transaction via MetaMask → hash persisted → toast monitors block confirmation.
4. **History enrichment:** Upon confirmation, receipt data appended to history; caching invalidated for gallery refresh.
5. **Gallery rendering:** `getCIDs` fetch uses cache first; unique entries displayed with count badges, download buttons, and QR codes.
6. **Verification:** Third-party page fetches contract data using `from` override to confirm CID membership.
- **Failure pathways:**
   - If IPFS upload fails, the CID is never staged and the user is prompted to retry; no contract interaction occurs.
   - If the contract call fails or is rejected in MetaMask, the staged CID remains available so the user can attempt again without re-uploading.
   - If RPC read fails when rendering the gallery, cached CIDs provide a continuity experience and a warning banner explains the fallback.

## 8. Development Methodology

## 9. Security, Privacy, and Risk Controls
- **Wallet security:** No private keys stored; operations require explicit MetaMask confirmation.
- **Input sanitisation:** File uploads rely on browser file pickers; metadata trimmed before caching.
- **Transport security:** All endpoints accessed via HTTPS except optional local IPFS server (development only).
- **Auditability:** Supabase audit logs capture user actions; when absent, logs remain local to console for debugging.
- **Resilience controls:** Contract readiness checks, network prompts, and caching ensure the UI avoids undefined behaviour during node resets.

## 10. Testing and Validation Plan
- **Automated (future scope):** Hardhat unit tests for contract functions and React Testing Library for critical components.
- **Manual acceptance tests:**
   1. Connect wallet, upload image, confirm CID displayed.
   2. Save to chain, witness toast progression, verify history entry.
   3. Refresh gallery, check image rendering and download functionality.
   4. Scan QR code, open verification URL, confirm ownership status.
   5. Inspect analytics page for updated metrics.
- **Regression checks:** `npm run build` executed post-change; verify that Supabase is optional by running without credentials.

## 11. Deployment and DevOps Procedures
- **Local workflow:**
   - Ensure no conflicting IPFS instance; run `npm run dev:local` to start Hardhat, local IPFS proxy, auto-deploy, and Vite simultaneously.
   - Auto-deploy script waits for RPC readiness, deploys contract, and writes addresses into `Config.json`.
- **Testnet workflow:**
   - Configure private key and RPC in Hardhat config (outside repository).
   - Execute `npm run deploy:amoy`; update `Config.json` with returned address.
- **Hosting considerations:**
   - Static hosting for Vite build (e.g., Vercel, Netlify, IPFS) paired with configured environment variables.
   - Backend services: Pinata account (API key/secret) and optional Supabase project.

## 12. Maintenance and Monitoring
- **Cache maintenance:** `invalidateCacheForAddress` triggers after uploads; settings page can clear caches manually.
- **Audit review:** Supabase dashboard can query `audit_logs` to monitor suspicious activity.
- **RPC monitoring:** Consider integrating service health checks for Amoy RPC endpoints; failover to alternative RPC URIs if necessary.
- **Dependency updates:** Regularly update npm dependencies, especially wagmi/ethers/Hardhat, verifying compatibility.

## 13. Limitations and Future Enhancements
- **Event absence:** Lack of smart contract events restricts on-chain history reconstruction. Future versions should emit `CIDAdded` and integrate The Graph or custom indexers.
- **Storage duplication:** Local transaction history relies on browser storage; multi-device sync would require Supabase tables or decentralized indexers.
- **Role management:** Currently single-role; future iterations could add photographer/curator roles with permissions.
- **Advanced verification:** Integrate zero-knowledge proofs or watermarking for stronger authenticity signals.
- **Mobile optimisation:** Tailwind provides responsiveness, but dedicated mobile design could improve UX in low-bandwidth conditions.

## 14. Conclusion
PhotoBlock validates the practicality of hybrid decentralized storage and blockchain proofs for media authenticity. The methodology outlined ensures stakeholders can reproduce the system, evaluate its reliability, and plan iterative enhancements such as event-driven indexing, richer analytics, and cross-device history persistence.

## 15. Appendix
### 15.1 Environment Variables
```
VITE_PINATA_URL=https://api.pinata.cloud/pinning/pinFileToIPFS
VITE_PINATA_API_KEY=<pinata-api-key>
VITE_PINATA_API_SECRET=<pinata-secret>
VITE_USE_LOCAL_IPFS=true|false
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
VITE_AMOY_RPC_URL=<optional custom rpc>
VITE_ENABLE_DEBUG=true|false
VITE_LOG_LEVEL=info|debug|warn|error
```

### 15.2 Key Commands
- Install dependencies: `npm install`
- Local dev stack: `npm run dev:local`
- Hardhat node only: `npm run chain`
- Deploy contract locally: `npm run chain:deploy`
- Deploy contract to Amoy: `npm run deploy:amoy`
- Production build: `npm run build`

### 15.3 File Index
- Smart contract: `src/contract/Contract.sol`
- Contract configuration: `src/contract/Config.json`
- Upload component: `src/component/Upload.jsx`
- Gallery component: `src/component/Gallery.jsx`
- Transaction history utilities: `src/utils/txHistory.js`
- Analytics page: `src/pages/Analytics.jsx`
- Explorer page: `src/pages/Explorer.jsx`
- Verification page: `src/pages/Verify.jsx`
- Audit service: `src/services/auditService.js`

---

**Document control**
- Last updated: 27 January 2026
- Maintainer: PhotoBlock engineering team
