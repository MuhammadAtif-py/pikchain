import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getContractForNetwork, LOCALHOST_CHAIN_ID, AMOY_CHAIN_ID } from '../utils/contract';
import QRCodeGen from '../component/QRCodeGen';

const NETWORKS = [
  { id: LOCALHOST_CHAIN_ID, name: 'Localhost (Hardhat)' },
  { id: AMOY_CHAIN_ID, name: 'Polygon Amoy' },
];

export default function VerifyPage() {
  const [params] = useSearchParams();
  const cid = (params.get('cid') || '').trim();
  const owner = (params.get('address') || '').trim();
  const networkParam = params.get('network');
  
  // Default to localhost for development, can be overridden by URL param
  const [selectedNetwork, setSelectedNetwork] = useState(
    networkParam === 'amoy' ? AMOY_CHAIN_ID : LOCALHOST_CHAIN_ID
  );

  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState(null);
  const [error, setError] = useState(null);

  // Re-verify when network changes
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setError(null);
      setFound(null);
      if (!cid || !owner) return;

      setLoading(true);
      try {
        const contract = getContractForNetwork(selectedNetwork);
        const list = await contract.getCIDs({ from: owner });
        if (cancelled) return;
        const normalized = Array.isArray(list) ? list.map((x) => String(x).trim()) : [];
        setFound(normalized.includes(cid));
      } catch (e) {
        if (cancelled) return;
        const msg = e?.message || 'Verification failed';
        // Provide helpful error messages
        if (msg.includes('CALL_EXCEPTION') || msg.includes('could not detect network')) {
          if (selectedNetwork === LOCALHOST_CHAIN_ID) {
            setError('Cannot connect to localhost. Make sure Hardhat node is running (npx hardhat node)');
          } else {
            setError('Contract call failed. The address may not have any photos on this network.');
          }
        } else {
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [cid, owner, selectedNetwork]);

  const verifyUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    if (!cid || !owner) return '';
    const u = new URL('/verify', window.location.origin);
    u.searchParams.set('cid', cid);
    u.searchParams.set('address', owner);
    u.searchParams.set('network', selectedNetwork === AMOY_CHAIN_ID ? 'amoy' : 'localhost');
    return u.toString();
  }, [cid, owner, selectedNetwork]);

  return (
    <div className="w-full p-5">
      <h1 className="text-2xl font-extrabold text-transparent bg-gradient-to-t from-teal-500 to-fuchsia-500 bg-clip-text">Verify</h1>

      <div className="p-4 mt-4 rounded-xl bg-white/10 border border-white/10">
        {/* Network Selector */}
        <div className="mb-4">
          <label className="text-xs text-slate-400 block mb-1">Network</label>
          <div className="flex gap-2">
            {NETWORKS.map((net) => (
              <button
                key={net.id}
                onClick={() => setSelectedNetwork(net.id)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  selectedNetwork === net.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {net.name}
              </button>
            ))}
          </div>
        </div>

        <div className="text-sm font-semibold">Verification inputs</div>
        <div className="mt-2 text-xs text-slate-300 break-all">Address: {owner || '—'}</div>
        <div className="mt-1 text-xs text-slate-300 break-all">CID: {cid || '—'}</div>

        {loading && <div className="mt-3 text-sm text-slate-300 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          Checking on {NETWORKS.find(n => n.id === selectedNetwork)?.name}…
        </div>}
        {error && <div className="mt-3 text-sm text-orange-400">{error}</div>}

        {!loading && found === true && (
          <div className="mt-3 text-sm text-teal-300 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verified: this CID exists for that address on-chain.
          </div>
        )}
        {!loading && found === false && (
          <div className="mt-3 text-sm text-orange-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Not found: this CID is not stored for that address on {NETWORKS.find(n => n.id === selectedNetwork)?.name}.
          </div>
        )}

        {verifyUrl && (
          <div className="mt-4">
            <QRCodeGen value={verifyUrl} filename={`photoblock-verify-${cid.slice(0,8)}-qr.png`} label="Share/scan to verify" />
          </div>
        )}

        <div className="mt-3 text-xs text-slate-400">
          Tip: Make sure you're checking the same network where the photo was uploaded.
        </div>
      </div>
    </div>
  );
}
