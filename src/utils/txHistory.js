const PREFIX = 'pikchain:txs';

function key(chainId, address) {
  if (!chainId || !address) return null;
  return `${PREFIX}:${String(chainId)}:${String(address).toLowerCase()}`;
}

export function loadTxHistory(chainId, address) {
  const k = key(chainId, address);
  if (!k) return [];
  try {
    const raw = localStorage.getItem(k);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
          .filter(Boolean)
          .filter((t) => typeof t?.hash === 'string')
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      : [];
  } catch {
    return [];
  }
}

export function upsertTxHistory(chainId, address, item) {
  const k = key(chainId, address);
  if (!k || !item?.hash) return;

  const existing = loadTxHistory(chainId, address);
  const next = [item, ...existing.filter((t) => t?.hash !== item.hash)].slice(0, 200);
  try {
    localStorage.setItem(k, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

export function removeTxHistory(chainId, address, hash) {
  const k = key(chainId, address);
  if (!k || !hash) return;
  const existing = loadTxHistory(chainId, address);
  const next = existing.filter((t) => t?.hash !== hash);
  try {
    localStorage.setItem(k, JSON.stringify(next));
  } catch {
    // ignore
  }
}
