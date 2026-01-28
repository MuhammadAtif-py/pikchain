import { useEffect, useMemo, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import { toast } from 'react-toastify';
import { loadTxHistory, upsertTxHistory } from '../utils/txHistory';
import { AMOY_CHAIN_ID, getAmoyProvider } from '../utils/provider';
import { blockUrl, txUrl } from '../utils/explorer';

function shortHash(h) {
  if (!h) return '';
  return `${h.slice(0, 10)}…${h.slice(-8)}`;
}

export default function TransactionHistory() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const chainId = chain?.id || AMOY_CHAIN_ID;

  const [items, setItems] = useState([]);
  const provider = useMemo(() => getAmoyProvider(), []);

  const reload = () => {
    if (!address) {
      setItems([]);
      return;
    }
    setItems(loadTxHistory(chainId, address));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, address]);

  useEffect(() => {
    if (!items.length || !address) return;

    let cancelled = false;

    const hydrate = async () => {
      const next = [...items];
      let changed = false;

      for (const item of next) {
        if (!item?.hash) continue;
        if (item.status === 'success' || item.status === 'failed') {
          if (item.blockNumber && item.blockTimestamp) continue;
        }

        try {
          const receipt = await provider.getTransactionReceipt(item.hash);
          if (cancelled) return;
          if (!receipt) continue;

          const status = receipt.status === 1 ? 'success' : 'failed';
          let blockTimestamp = item.blockTimestamp;
          if (!blockTimestamp && receipt.blockNumber) {
            const block = await provider.getBlock(receipt.blockNumber);
            if (cancelled) return;
            blockTimestamp = block?.timestamp ? block.timestamp * 1000 : undefined;
          }

          const updated = {
            ...item,
            status,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed?.toString?.() ?? item.gasUsed,
            blockTimestamp,
          };

          upsertTxHistory(chainId, address, updated);
          Object.assign(item, updated);
          changed = true;
        } catch {
          // ignore
        }
      }

      if (changed && !cancelled) setItems(loadTxHistory(chainId, address));
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [items, provider, chainId, address]);

  const rows = items;

  if (!isConnected) {
    return (
      <div className="w-full p-4 rounded-xl bg-white/10">
        <div className="text-sm text-slate-200">Connect wallet to view your transaction history.</div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 rounded-xl bg-white/10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-transparent bg-gradient-to-t from-teal-500 to-fuchsia-500 bg-clip-text">Transaction History</h2>
        <button
          onClick={() => {
            reload();
            toast.info('Refreshed history');
          }}
          className="px-3 py-1 text-xs rounded bg-gradient-to-r from-teal-600 to-fuchsia-600 hover:from-teal-500 hover:to-fuchsia-500"
        >
          Refresh
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 text-sm text-slate-300">No transactions tracked yet. Save a CID to Pikchain first.</div>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((tx) => {
            const when = tx.blockTimestamp || tx.createdAt;
            const status = tx.status || 'pending';
            return (
              <div key={tx.hash} className="p-3 border border-white/10 rounded-xl bg-black/10">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {tx.action === 'addCID' ? 'CID saved to chain' : 'Transaction'}
                      {tx.cid ? <span className="ml-2 text-xs font-mono opacity-80">{tx.cid}</span> : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-300">
                      Status: <span className="font-semibold">{status}</span>
                      {typeof tx.gasUsed !== 'undefined' && tx.gasUsed !== null && (
                        <span className="ml-3">Gas: {Number(tx.gasUsed).toLocaleString?.() || tx.gasUsed}</span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {when ? new Date(when).toLocaleString() : '—'}
                      {tx.blockNumber ? (
                        <a
                          className="ml-3 underline text-teal-300"
                          href={blockUrl(tx.blockNumber, chainId)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Block #{tx.blockNumber}
                        </a>
                      ) : (
                        <span className="ml-3">Block —</span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] font-mono opacity-80 break-all">{shortHash(tx.hash)}</div>
                  </div>

                  <a
                    className="shrink-0 px-3 py-1 text-xs rounded bg-gradient-to-r from-teal-600 to-fuchsia-600 hover:from-teal-500 hover:to-fuchsia-500"
                    href={txUrl(tx.hash, chainId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PolygonScan
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
