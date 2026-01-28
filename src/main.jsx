// Polyfills are handled by vite-plugin-node-polyfills

import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import ErrorBoundary from "./ErrorBoundary";
import log from './utils/logger';
import {
  DEFAULT_LOCAL_CHAIN_ID,
  LEGACY_LOCAL_CHAIN_ID,
  AMOY_CHAIN_ID,
} from "./utils/networks";

// Localhost network (Hardhat) - NO API NEEDED!
const createLocalhostChain = (id, label, networkName) => ({
  id,
  name: label,
  network: networkName,
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545']
    },
    public: {
      http: ['http://127.0.0.1:8545']
    }
  },
});

const localhost = createLocalhostChain(DEFAULT_LOCAL_CHAIN_ID, 'Localhost', 'localhost');
const localhostLegacy = createLocalhostChain(LEGACY_LOCAL_CHAIN_ID, 'Localhost Legacy', 'localhost-legacy');

const polygonAmoy = {
  id: AMOY_CHAIN_ID,
  name: 'Polygon Amoy',
  network: 'polygon-amoy',
  nativeCurrency: {
    decimals: 18,
    name: 'Polygon Matic',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-amoy.polygon.technology']
    },
    public: {
      http: ['https://rpc-amoy.polygon.technology']
    }
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://amoy.polygonscan.com' },
  },
};

// Use localhost by default for development (no API costs!)
// Set VITE_USE_TESTNET=true to use Polygon Amoy
const useTestnet = import.meta.env.VITE_USE_TESTNET === 'true';
const chains = useTestnet ? [polygonAmoy] : [localhost, localhostLegacy, polygonAmoy];
const defaultChain = useTestnet ? polygonAmoy : localhost;

// Configure public provider (no API key needed)
const { provider, webSocketProvider } = configureChains(chains, [publicProvider()]);

const wagmiClient = createClient({
  autoConnect: true,
  connectors: [new MetaMaskConnector({ chains })],
  provider,
  webSocketProvider
});

log.info('App bootstrap', { chainId: defaultChain.id, network: defaultChain.name });

function PerfLogger() {
  useEffect(() => {
    const t = performance.now();
    log.debug('Initial render ms', Math.round(t));
  }, []);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WagmiConfig client={wagmiClient}>
  <PerfLogger />
  <App />
      </WagmiConfig>
    </ErrorBoundary>
  </React.StrictMode>
);
