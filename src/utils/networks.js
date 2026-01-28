// Shared network helpers to keep chain handling consistent across the app.
export const DEFAULT_LOCAL_CHAIN_ID = 31337;
export const LEGACY_LOCAL_CHAIN_ID = 1337;
export const AMOY_CHAIN_ID = 80002;

export const LOCAL_CHAIN_IDS = [DEFAULT_LOCAL_CHAIN_ID, LEGACY_LOCAL_CHAIN_ID];
export const SUPPORTED_CHAIN_IDS = [...LOCAL_CHAIN_IDS, AMOY_CHAIN_ID];

const normalizeChainId = (chainId) => {
  if (typeof chainId === 'number') return chainId;
  if (typeof chainId === 'string') {
    const parsed = Number(chainId);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const isLocalChain = (chainId) => {
  const id = normalizeChainId(chainId);
  return id !== null && LOCAL_CHAIN_IDS.includes(id);
};

export const isSupportedChain = (chainId) => {
  const id = normalizeChainId(chainId);
  return id !== null && SUPPORTED_CHAIN_IDS.includes(id);
};

export const resolveTargetChainId = (chainId) => {
  const id = normalizeChainId(chainId);
  if (id !== null && isSupportedChain(id)) {
    return isLocalChain(id) ? id : AMOY_CHAIN_ID;
  }
  return DEFAULT_LOCAL_CHAIN_ID;
};

export const getNetworkLabel = (chainId) => {
  const id = normalizeChainId(chainId);
  if (id === AMOY_CHAIN_ID) return 'Polygon Amoy (80002)';
  if (id === LEGACY_LOCAL_CHAIN_ID) return 'Localhost (chain 1337)';
  return 'Localhost (Hardhat 31337)';
};

export const getSwitchHint = (targetChainId) => {
  const id = normalizeChainId(targetChainId);
  if (id === AMOY_CHAIN_ID) return 'Polygon Amoy (80002)';
  if (id === LEGACY_LOCAL_CHAIN_ID) return 'Localhost (chain 1337)';
  return 'Localhost (chain 31337)';
};
