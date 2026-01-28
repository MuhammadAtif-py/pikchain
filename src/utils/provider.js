import { ethers } from 'ethers';

export const AMOY_CHAIN_ID = 80002;
export const DEFAULT_AMOY_RPC_URL = 'https://rpc-amoy.polygon.technology';

const AMOY_NETWORK = { name: 'polygon-amoy', chainId: AMOY_CHAIN_ID };

// Browser CORS can break some RPCs. Keep multiple public endpoints as fallback.
// You can override by setting:
// - VITE_AMOY_RPC_URL (single)
// - VITE_AMOY_RPC_URLS (comma-separated)
const FALLBACK_AMOY_RPCS = [
  DEFAULT_AMOY_RPC_URL,
  'https://polygon-amoy-bor-rpc.publicnode.com',
  'https://rpc.ankr.com/polygon_amoy',
  'https://polygon-amoy.drpc.org',
];

let amoyProvider;

export function getAmoyRpcUrl() {
  return import.meta.env.VITE_AMOY_RPC_URL || DEFAULT_AMOY_RPC_URL;
}

export function getAmoyRpcUrls() {
  const multi = (import.meta.env.VITE_AMOY_RPC_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const single = getAmoyRpcUrl();
  const all = [single, ...multi, ...FALLBACK_AMOY_RPCS].filter(Boolean);
  return Array.from(new Set(all));
}

export function getAmoyProvider() {
  if (!amoyProvider) {
    const urls = getAmoyRpcUrls();
    const providers = urls.map(
      (url) =>
        new ethers.providers.StaticJsonRpcProvider(
          { url, timeout: 10_000 },
          AMOY_NETWORK
        )
    );
    amoyProvider = new ethers.providers.FallbackProvider(providers);
  }
  return amoyProvider;
}
