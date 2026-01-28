import { useEffect, useMemo, useState } from 'react';
import { getAmoyProvider, AMOY_CHAIN_ID } from '../utils/provider';
import { blockUrl } from '../utils/explorer';

function shortHex(v) {
  if (!v) return '';
  return `${v.slice(0, 10)}…${v.slice(-8)}`;
}

export default function ExplorerPage() {
  const provider = useMemo(() => getAmoyProvider(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blocks, setBlocks] = useState([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const tip = await provider.getBlockNumber();
      const count = 15;
      const numbers = Array.from({ length: count }, (_, i) => tip - i).filter((n) => n >= 0);
      const fetched = [];
      for (const n of numbers) {
        // eslint-disable-next-line no-await-in-loop
        const b = await provider.getBlock(n);
        fetched.push(b);
      }
      setBlocks(fetched);
    } catch (e) {
      setError(e?.message || 'Failed to load blocks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full p-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-transparent bg-gradient-to-t from-teal-500 to-fuchsia-500 bg-clip-text">
          Chain Explorer
        </h1>
        <button
          onClick={load}
          className="px-3 py-1 text-xs rounded bg-gradient-to-r from-teal-600 to-fuchsia-600 hover:from-teal-500 hover:to-fuchsia-500"
        >
          Refresh
        </button>
      </div>

      {loading && <div className="mt-4 text-sm text-slate-300">Loading latest blocks…</div>}
      {error && <div className="mt-4 text-sm text-orange-400">{error}</div>}

      {!loading && !error && (
        <div className="mt-4 space-y-3">
          {blocks.map((b) => (
            <div key={b.number} className="p-4 rounded-xl bg-white/10 border border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    Block #{b.number}{' '}
                    {b.number === 0 && <span className="ml-2 text-xs text-teal-300">Genesis</span>}
                  </div>
                  <div className="mt-1 text-xs text-slate-300">
                    {b.timestamp ? new Date(b.timestamp * 1000).toLocaleString() : '—'}
                    <span className="ml-3">Txs: {b.transactions?.length || 0}</span>
                  </div>
                  <div className="mt-2 text-xs font-mono opacity-80">Hash: {shortHex(b.hash)}</div>
                  <div className="mt-1 text-xs font-mono opacity-80">
                    Parent: {shortHex(b.parentHash)}
                    {b.number > 0 && (
                      <a
                        className="ml-2 underline text-teal-300"
                        href={blockUrl(b.number - 1, AMOY_CHAIN_ID)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        (open)
                      </a>
                    )}
                  </div>
                </div>

                <a
                  className="shrink-0 px-3 py-1 text-xs rounded bg-gradient-to-r from-teal-600 to-fuchsia-600 hover:from-teal-500 hover:to-fuchsia-500"
                  href={blockUrl(b.number, AMOY_CHAIN_ID)}
                  target="_blank"
                  rel="noreferrer"
                >
                  PolygonScan
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 text-xs text-slate-400">Shows the latest 15 blocks on Polygon Amoy.</div>
    </div>
  );
}
