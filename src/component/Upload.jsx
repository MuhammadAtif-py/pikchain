import { useState, useEffect } from "react";
import log from '../utils/logger';
import axios from "axios";
import confi from "../contract/Config.json";
import Abi from "../contract/Abi.json";
import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
  useAccount,
  useNetwork,
  useSwitchNetwork,
} from "wagmi";
import { toast } from "react-toastify";
import TxStatusToast from "./TxStatusToast";
import { loadTxHistory, upsertTxHistory } from "../utils/txHistory";
import { invalidateCacheForAddress } from "../utils/cache";
import { auditLog, AUDIT_ACTIONS } from "../services/auditService";
import {
  resolveTargetChainId,
  isSupportedChain,
  getSwitchHint,
} from "../utils/networks";
import useContractReady from "../utils/useContractReady";

const Upload = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: switching } = useSwitchNetwork();
  const [file, setFile] = useState(null);
  const [cid, setCid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTxHash, setCurrentTxHash] = useState(null);
  
  const TARGET_CHAIN_ID = resolveTargetChainId(chain?.id);
  const networkReady = chain?.id === TARGET_CHAIN_ID && isSupportedChain(chain?.id);
  const switchHint = getSwitchHint(TARGET_CHAIN_ID);
  const needsSwitch = Boolean(chain?.id) && !networkReady;
  
  // Get contract address for current network
  const networkConfig = confi.NETWORKS?.[TARGET_CHAIN_ID.toString()];
  const contractAddress = networkConfig?.CONTRACT_ADDRESS || confi.CONTRACT_ADDRESS;
  const { ready: contractReady, loading: contractCheckLoading } = useContractReady(contractAddress, TARGET_CHAIN_ID, networkReady);

  const { config, error: prepareError } = usePrepareContractWrite({
    address: contractAddress,
    abi: Abi,
    functionName: "addCID",
    args: [cid],
    chainId: TARGET_CHAIN_ID,
    enabled: Boolean(cid && networkReady && contractReady),
  });

  const { data, write, error: writeError } = useContractWrite(config);

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  useEffect(() => {
    if (data?.hash) {
      setCurrentTxHash(data.hash);
      upsertTxHistory(TARGET_CHAIN_ID, address, {
        hash: data.hash,
        cid,
        contractAddress,
        action: 'addCID',
        createdAt: Date.now(),
        status: 'pending',
      });
    }
  }, [data?.hash, TARGET_CHAIN_ID, address, cid, contractAddress]);

  useEffect(() => {
    if (isSuccess) {
      log.info('CID saved to chain', { hash: data?.hash, cid });
      toast.dismiss();
      toast.success('Saved to Pikchain successfully');
      // Invalidate cache so Gallery refreshes with new data
      invalidateCacheForAddress(address, TARGET_CHAIN_ID);
      (async () => {
        try {
          await auditLog(
            AUDIT_ACTIONS.PHOTO_SAVE_CHAIN,
            'photo',
            cid,
            null,
            {
              cid,
              txHash: data?.hash || null,
              chainId: TARGET_CHAIN_ID,
              contractAddress,
            }
          );
        } catch (auditError) {
          log.warn('Audit log (chain save) failed', auditError);
        }
      })();
    }
    
    // Show errors if any
    if (prepareError) {
      // Suppress noisy underlying network changed until user switches
      if (prepareError?.code === 'NETWORK_ERROR') {
        log.warn('Prepare network mismatch', { current: chain?.id, expected: TARGET_CHAIN_ID });
      } else {
        log.error('Prepare error', prepareError);
      }
    }
    if (writeError) {
      log.error('Write error', writeError);
      toast.error('Transaction failed');
    }
  }, [isSuccess, prepareError, writeError, address, TARGET_CHAIN_ID, cid, data?.hash, contractAddress, chain?.id]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    setLoading(true);
    
    // Use local IPFS server if available, otherwise fall back to Pinata
    const useLocalIPFS = import.meta.env.VITE_USE_LOCAL_IPFS === 'true';
    const url = useLocalIPFS 
      ? 'http://localhost:3001/pinning/pinFileToIPFS'
      : (import.meta.env.VITE_PINATA_URL || 'https://api.pinata.cloud/pinning/pinFileToIPFS');
    const apiKey = import.meta.env.VITE_PINATA_API_KEY;
    const apiSecret = import.meta.env.VITE_PINATA_API_SECRET;

    const formData = new FormData();
    formData.append("file", file);

    try {
      log.info('Uploading file', { name: file?.name, size: file?.size, local: useLocalIPFS });
      
      // Don't set Content-Type manually - let axios set it with proper boundary
      const headers = {};
      // Only add Pinata headers if using Pinata
      if (!useLocalIPFS) {
        headers.pinata_api_key = apiKey;
        headers.pinata_secret_api_key = apiSecret;
      }
      
      const response = await axios.post(url, formData, { headers });
      const newCid = response.data.IpfsHash;
      setCid(newCid);
      log.info('Upload success', { cid: newCid });
      toast.success("Uploaded successfully! Click 'Save to Pikchain'");
      try {
        await auditLog(
          AUDIT_ACTIONS.PHOTO_UPLOAD,
          'photo',
          newCid,
          null,
          {
            cid: newCid,
            fileName: file?.name || null,
            fileSize: file?.size || null,
            contentType: file?.type || null,
          },
          { provider: useLocalIPFS ? 'local' : 'pinata' }
        );
      } catch (auditError) {
        log.warn('Audit log (upload) failed', auditError);
      }
    } catch (error) {
      log.error('Upload failed', error);
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWrite = () => {
    if (!networkReady) {
      const message = needsSwitch ? `Wrong network. Switch to ${switchHint}.` : 'Connect your wallet before saving.';
      toast.error(message);
      return;
    }
    if (!contractReady) {
      toast.error('Local contract not deployed yet. Wait for auto-deploy to finish.');
      return;
    }
    if (write && cid) {
      try {
        write();
      } catch (error) {
        log.error('Immediate write error', error);
        toast.error('Failed to save to blockchain');
      }
    } else {
      toast.error('Wallet not connected or no CID available');
    }
  };

  return (
    <div className="w-full h-auto p-2 rounded-xl">
      {currentTxHash && (
        <TxStatusToast
          txHash={currentTxHash}
          chainId={TARGET_CHAIN_ID}
          onDone={(receipt, blockTimestampMs) => {
            try {
              const existing = loadTxHistory(TARGET_CHAIN_ID, address).find((t) => t?.hash === currentTxHash);
              upsertTxHistory(TARGET_CHAIN_ID, address, {
                hash: currentTxHash,
                cid,
                contractAddress,
                action: 'addCID',
                createdAt: existing?.createdAt || Date.now(),
                status: receipt?.status === 1 ? 'success' : 'failed',
                blockNumber: receipt?.blockNumber,
                gasUsed: receipt?.gasUsed?.toString?.() ?? undefined,
                blockTimestamp: blockTimestampMs || existing?.blockTimestamp,
              });
            } catch {
              // ignore
            }
            setCurrentTxHash(null);
          }}
        />
      )}
      <div className="flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-4 group">
          <div className="p-1 border border-transparent rounded bg-gradient-to-l group-hover:bg-gradient-to-r from-teal-600 to-fuchsia-600 bg-clip-border ">
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>
          <div>
            {!cid && (
              <button
                className="p-2 px-5 rounded bg-gradient-to-r group-hover:bg-gradient-to-l disabled:cursor-not-allowed from-teal-600 to-fuchsia-600"
                onClick={handleUpload}
                disabled={!file || loading}
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            )}{" "}
          </div>
          <div>
            {cid && (
              <>
                {networkReady ? (
                  <button
                    className="p-2 px-5 rounded bg-gradient-to-r group-hover:bg-gradient-to-l disabled:cursor-not-allowed from-teal-600 to-fuchsia-600"
                    onClick={handleWrite}
                    disabled={!cid || isLoading || !write || !contractReady}
                  >
                    {isLoading ? "Saving..." : "Save to Pikchain"}
                  </button>
                ) : (
                  <button
                    className="p-2 px-5 rounded bg-gradient-to-r from-orange-600 to-pink-600 disabled:cursor-not-allowed"
                    onClick={() => switchNetwork?.(TARGET_CHAIN_ID)}
                    disabled={switching}
                  >
                    {switching ? 'Switching...' : `Switch to ${switchHint}`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div>
          <span className="text-xs text-center text-gray-500">
            upload ⟩ Save to Pikchain ⟩ reload
          </span>
          {needsSwitch && (
            <div className="mt-2 text-xs text-orange-400">
              Wrong network selected in wallet. Please switch to {switchHint}.
            </div>
          )}
          {!needsSwitch && networkReady && !contractReady && !contractCheckLoading && (
            <div className="mt-2 text-xs text-orange-400">
              Contract not deployed on this chain yet. Keep dev:local running and wait a few seconds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
