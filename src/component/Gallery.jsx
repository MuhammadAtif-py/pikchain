import confi from "../contract/Config.json";
import Abi from "../contract/Abi.json";
import { useAccount, useContractRead, useNetwork } from "wagmi";
import { useState, useEffect, memo, useCallback } from 'react';
import log from '../utils/logger';
import QRCodeGen from './QRCodeGen';
import { toast } from 'react-toastify';
import { getCache, setCache, CACHE_KEYS } from '../utils/cache';
import {
  resolveTargetChainId,
  isSupportedChain,
  isLocalChain,
  getNetworkLabel,
  getSwitchHint,
} from '../utils/networks';
import useContractReady from '../utils/useContractReady';

// Check if using local IPFS
const USE_LOCAL_IPFS = import.meta.env.VITE_USE_LOCAL_IPFS === 'true';

// Local IPFS gateway (first) + public gateways for fallback
const GATEWAYS = USE_LOCAL_IPFS 
  ? [
      "http://localhost:3001/ipfs/",  // Local IPFS server first
      "https://ipfs.io/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/",
      "https://gateway.pinata.cloud/ipfs/",
    ]
  : [
      "https://ipfs.io/ipfs/",
      "https://cloudflare-ipfs.com/ipfs/",
      "https://gateway.pinata.cloud/ipfs/",
      "https://gateway.ipfs.io/ipfs/"
    ];

// Download utility - fetches image blob and triggers browser download
const downloadImage = async (cid, gatewayIndex = 0) => {
  if (gatewayIndex >= GATEWAYS.length) {
    throw new Error('All gateways failed for download');
  }
  
  const url = `${GATEWAYS[gatewayIndex]}${cid}`;
  
  try {
    const response = await fetch(url, { 
      method: 'GET',
      mode: 'cors',
      cache: 'force-cache'
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.split('/')[1]?.split(';')[0] || 'jpg';
    
    // Create download link
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `photoblock-${cid.slice(0, 8)}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    
    log.info('Download success', { cid, gateway: GATEWAYS[gatewayIndex] });
    return true;
  } catch (error) {
    log.warn('Download gateway failed, trying next', { cid, gateway: GATEWAYS[gatewayIndex], error: error.message });
    return downloadImage(cid, gatewayIndex + 1);
  }
};

const IPFSImage = memo(function IPFSImage({ cid, onDownload }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const src = `${GATEWAYS[index]}${cid}`;

  // Auto-fallback on timeout
  useEffect(() => {
    if (loaded || index >= GATEWAYS.length - 1) return;
    const t = setTimeout(() => {
      setIndex(i => {
        const next = i < GATEWAYS.length - 1 ? i + 1 : i;
        if (next !== i) log.warn('Gateway timeout', { cid: cid.slice(0, 8), to: next });
        return next;
      });
    }, 3000);
    return () => clearTimeout(t);
  }, [index, loaded, cid]);

  const handleError = useCallback(() => {
    if (index < GATEWAYS.length - 1) {
      setIndex(i => i + 1);
      log.warn('Image error fallback', { cid: cid.slice(0, 8) });
    }
  }, [index, cid]);

  const handleDownload = useCallback(async (e) => {
    e.stopPropagation();
    if (downloading) return;
    
    setDownloading(true);
    try {
      await downloadImage(cid, index); // Start from current working gateway
      toast.success('Download started!');
    } catch (error) {
      toast.error('Download failed');
      log.error('Download failed', { cid, error: error.message });
    } finally {
      setDownloading(false);
    }
  }, [cid, index, downloading]);

  return (
    <div className="relative group">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-teal-300 animate-pulse bg-black/10 rounded-xl">
          Loading...
        </div>
      )}
      <img
        className={`p-2 scale-95 hover:border rounded-xl hover:scale-105 transition-all cursor-pointer ${loaded ? 'opacity-100' : 'opacity-0'}`}
        src={src}
        width={100}
        alt={`IPFS: ${cid.slice(0, 8)}...`}
        loading="lazy"
        onError={handleError}
        onLoad={() => setLoaded(true)}
        title={`CID: ${cid}`}
      />
      {/* Download button overlay */}
      {loaded && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="absolute bottom-2 right-2 p-1.5 bg-black/70 hover:bg-teal-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-wait"
          title="Download image"
        >
          {downloading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
});

const Gallery = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();

  const TARGET_CHAIN_ID = resolveTargetChainId(chain?.id);
  const networkReady = isSupportedChain(chain?.id);
  const isLocal = isLocalChain(TARGET_CHAIN_ID);
  const switchHint = getSwitchHint(TARGET_CHAIN_ID);
  const needsSwitch = Boolean(chain?.id) && !networkReady;
  
  // Get contract address for current network
  const networkConfig = confi.NETWORKS?.[TARGET_CHAIN_ID.toString()];
  const contractAddress = networkConfig?.CONTRACT_ADDRESS || confi.CONTRACT_ADDRESS;
  const networkName = getNetworkLabel(TARGET_CHAIN_ID);
  const { ready: contractReady, loading: contractLoading } = useContractReady(contractAddress, TARGET_CHAIN_ID, networkReady);

  // Local cache state for fallback
  const [cachedCids, setCachedCids] = useState(() => 
    getCache(CACHE_KEYS.CIDS(address, TARGET_CHAIN_ID)) || []
  );
  const [rpcError, setRpcError] = useState(false);

  const { data: cids, isLoading, refetch, isError } = useContractRead({
    address: contractAddress,
    abi: Abi,
    functionName: "getCIDs",
    overrides: address ? { from: address } : undefined,
    watch: true,
    enabled: networkReady && contractReady && Boolean(address),
    chainId: TARGET_CHAIN_ID,
    onSuccess: (data) => {
      const arr = Array.isArray(data) ? data : [];
      setCache(CACHE_KEYS.CIDS(address, TARGET_CHAIN_ID), arr);
      setCachedCids(arr);
      setRpcError(false);
    },
    onError: (err) => {
      log.warn('RPC error, using cache', err?.message);
      setRpcError(true);
    },
  });

  // Use cached data on RPC error
  const effectiveCids = rpcError || isError ? cachedCids : (cids || cachedCids);

  // Normalize & deduplicate CIDs
  const normalized = Array.isArray(effectiveCids)
    ? effectiveCids.map(v => (typeof v === 'string' ? v.trim() : v?.toString?.().trim())).filter(Boolean)
    : [];
  const counts = normalized.reduce((acc, cid) => { acc[cid] = (acc[cid] || 0) + 1; return acc; }, {});
  const uniqueCids = Object.keys(counts);
  const showLoading = isLoading || contractLoading;
  
  useEffect(() => { 
    log.debug('Gallery', { total: normalized.length, unique: uniqueCids.length, network: TARGET_CHAIN_ID }); 
  }, [normalized.length, uniqueCids.length, TARGET_CHAIN_ID]);

  // Download all images
  const handleDownloadAll = async () => {
    if (!uniqueCids.length) return;
    toast.info(`Downloading ${uniqueCids.length} images...`);
    
    for (const cid of uniqueCids) {
      try {
        await downloadImage(cid);
        await new Promise(r => setTimeout(r, 500)); // Small delay between downloads
      } catch (error) {
        log.error('Bulk download failed', { cid });
      }
    }
    toast.success('All downloads complete!');
  };

  return (
    <div className="w-full h-full p-2 overflow-y-auto rounded-xl bg-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-extrabold text-transparent bg-gradient-to-t from-teal-500 to-fuchsia-500 bg-clip-text">
            Gallery
          </h1>
          <span className="text-xs text-gray-500">({networkName})</span>
        </div>
        <div className="flex items-center gap-2">
          {uniqueCids.length > 0 && (
            <button
              onClick={handleDownloadAll}
              className="p-2 text-xs text-teal-400 hover:text-teal-300 hover:bg-white/5 rounded-lg flex items-center gap-1"
              title="Download all images"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              All
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-full hover:animate-spin hover:bg-white/5"
            title="Refresh gallery"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>
      
      {!networkReady && (
        <div className="p-3 mb-3 text-sm text-orange-400 rounded bg-white/5">
          {needsSwitch ? `Wrong network selected. Switch to ${switchHint}.` : 'Connect your wallet to view gallery.'}
        </div>
      )}
      {networkReady && !contractReady && !contractLoading && (
        <div className="p-3 mb-3 text-sm text-orange-400 rounded bg-white/5">
          Contract not deployed yet on this chain. Wait for dev:local auto-deploy to finish or run npm run chain:deploy.
        </div>
      )}
      
      {showLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {networkReady && contractReady && !showLoading && uniqueCids.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {uniqueCids.map((cid) => {
            const dupCount = counts[cid];
            const verifyUrl = address ? `${window.location.origin}/verify?address=${address}&cid=${encodeURIComponent(cid)}&network=${isLocal ? 'localhost' : 'amoy'}` : '';
            return (
              <div key={cid} className="relative flex flex-col items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                <IPFSImage cid={cid} />
                {/* Download Image Button - Clear and Separate */}
                <button
                  onClick={() => downloadImage(cid).then(() => toast.success('Image downloaded!')).catch(() => toast.error('Download failed'))}
                  className="w-full px-3 py-1.5 text-xs bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 rounded-lg flex items-center justify-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Image
                </button>
                <div className="flex items-center gap-2">
                  <QRCodeGen value={verifyUrl} filename={`photoblock-${cid.slice(0, 8)}-qr.png`} label="QR" />
                </div>
                {dupCount > 1 && (
                  <span className="absolute top-1 right-1 bg-fuchsia-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    x{dupCount}
                  </span>
                )}
                <span className="text-[9px] text-gray-500 truncate w-full text-center" title={cid}>
                  {cid.slice(0, 12)}...
                </span>
              </div>
            );
          })}
        </div>
      ) : networkReady && contractReady && !showLoading ? (
        <div className="flex flex-col items-center justify-center p-8 text-gray-400">
          <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No photos yet</p>
          <p className="text-xs">Upload your first photo above</p>
        </div>
      ) : null}
    </div>
  );
};

export default Gallery;
