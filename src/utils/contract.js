import { ethers } from 'ethers';
import Abi from '../contract/Abi.json';
import confi from '../contract/Config.json';
import { getAmoyProvider } from './provider';
import {
  DEFAULT_LOCAL_CHAIN_ID,
  LEGACY_LOCAL_CHAIN_ID,
  AMOY_CHAIN_ID,
  isLocalChain,
  resolveTargetChainId,
} from './networks';

export const CONTRACT_ADDRESS = confi.CONTRACT_ADDRESS;
export const LOCALHOST_CHAIN_ID = DEFAULT_LOCAL_CHAIN_ID;
export const LEGACY_CHAIN_ID = LEGACY_LOCAL_CHAIN_ID;
export { AMOY_CHAIN_ID };

// Get contract address for a specific network
export function getContractAddress(chainId) {
  const targetId = resolveTargetChainId(chainId);
  const networkConfig = confi.NETWORKS?.[targetId?.toString()];
  return networkConfig?.CONTRACT_ADDRESS || confi.CONTRACT_ADDRESS;
}

// Get localhost provider
export function getLocalhostProvider(chainId = DEFAULT_LOCAL_CHAIN_ID) {
  return new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545', { chainId, name: 'localhost' });
}

// Get read-only contract for Amoy (default)
export function getReadOnlyContract(address = CONTRACT_ADDRESS) {
  const provider = getAmoyProvider();
  return new ethers.Contract(address, Abi, provider);
}

// Get read-only contract for localhost
export function getLocalhostContract() {
  const address = getContractAddress(LOCALHOST_CHAIN_ID);
  const provider = getLocalhostProvider(LOCALHOST_CHAIN_ID);
  return new ethers.Contract(address, Abi, provider);
}

// Get contract for any supported network
export function getContractForNetwork(chainId) {
  const targetId = resolveTargetChainId(chainId);
  const address = getContractAddress(targetId);
  if (isLocalChain(targetId)) {
    return new ethers.Contract(address, Abi, getLocalhostProvider(targetId));
  }
  return new ethers.Contract(address, Abi, getAmoyProvider());
}
