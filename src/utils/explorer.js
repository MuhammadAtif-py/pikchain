import confi from '../contract/Config.json';

export function getExplorerBaseUrl(chainId = 80002) {
  const url = confi?.NETWORKS?.[String(chainId)]?.SCAN_LINK;
  if (!url) return 'https://amoy.polygonscan.com';
  // Config stores an address URL; normalize to base.
  // e.g. https://amoy.polygonscan.com/address/0x...
  return url.replace(/\/address\/.+$/i, '');
}

export function txUrl(hash, chainId = 80002) {
  return `${getExplorerBaseUrl(chainId)}/tx/${hash}`;
}

export function blockUrl(blockNumber, chainId = 80002) {
  return `${getExplorerBaseUrl(chainId)}/block/${blockNumber}`;
}

export function addressUrl(address, chainId = 80002) {
  return `${getExplorerBaseUrl(chainId)}/address/${address}`;
}
