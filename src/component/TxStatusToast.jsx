import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { txUrl } from '../utils/explorer';
import { getAmoyProvider } from '../utils/provider';

const STATUS = {
  pending: 'Pending',
  confirming: 'Confirming',
  success: 'Success',
  failed: 'Failed',
};

function fmtGas(gasUsed) {
  try {
    const n = typeof gasUsed === 'string' ? Number(gasUsed) : gasUsed?.toNumber?.() ?? Number(gasUsed);
    return Number.isFinite(n) ? n.toLocaleString() : String(gasUsed);
  } catch {
    return String(gasUsed);
  }
}

export default function TxStatusToast({ txHash, chainId = 80002, onDone }) {
  const [status, setStatus] = useState('pending');
  const [details, setDetails] = useState(null);

  const href = useMemo(() => (txHash ? txUrl(txHash, chainId) : null), [txHash, chainId]);

  useEffect(() => {
    if (!txHash) return;

    let cancelled = false;
    const id = toast(
      <div className="text-sm">
        <div className="font-semibold">{STATUS[status] || status}…</div>
        <div className="mt-1 font-mono text-[11px] opacity-80 break-all">{txHash}</div>
      </div>,
      { autoClose: false }
    );

    const run = async () => {
      try {
        const provider = getAmoyProvider();
        if (cancelled) return;
        setStatus('confirming');
        toast.update(id, {
          render: (
            <div className="text-sm">
              <div className="font-semibold">Confirming…</div>
              <div className="mt-1 font-mono text-[11px] opacity-80 break-all">{txHash}</div>
            </div>
          ),
        });

        const receipt = await provider.waitForTransaction(txHash, 1);
        if (cancelled) return;

        let blockTimestampMs;
        if (receipt?.blockNumber) {
          const block = await provider.getBlock(receipt.blockNumber);
          if (cancelled) return;
          blockTimestampMs = block?.timestamp ? block.timestamp * 1000 : undefined;
        }

        const ok = receipt?.status === 1;
        setStatus(ok ? 'success' : 'failed');
        setDetails({
          blockNumber: receipt?.blockNumber,
          gasUsed: receipt?.gasUsed?.toString?.() ?? String(receipt?.gasUsed ?? ''),
        });

        toast.update(id, {
          type: ok ? 'success' : 'error',
          autoClose: 6000,
          render: (
            <div className="text-sm">
              <div className="font-semibold">{ok ? 'Transaction Confirmed' : 'Transaction Failed'}</div>
              {ok && (
                <div className="mt-1 text-xs opacity-90">
                  <div>Block: #{receipt?.blockNumber}</div>
                  <div>Gas used: {fmtGas(receipt?.gasUsed)}</div>
                </div>
              )}
              {href && (
                <a className="mt-2 inline-block text-xs underline" href={href} target="_blank" rel="noreferrer">
                  View on PolygonScan
                </a>
              )}
            </div>
          ),
        });

        onDone?.(receipt, blockTimestampMs);
      } catch {
        if (cancelled) return;
        setStatus('failed');
        toast.error('Transaction failed');
      }
    };

    run();
    return () => {
      cancelled = true;
      toast.dismiss(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txHash]);

  return null;
}
