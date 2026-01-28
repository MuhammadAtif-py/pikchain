import { useEffect, useRef, useState } from 'react';
import { useProvider } from 'wagmi';
import log from './logger';

const isNonEmptyBytecode = (value) => typeof value === 'string' && value !== '0x' && value.length > 2;

export default function useContractReady(contractAddress, chainId, enabled = true) {
  const provider = useProvider({ chainId });
  const [loading, setLoading] = useState(Boolean(enabled));
  const [ready, setReady] = useState(false);
  const lastAddress = useRef();
  const lastChainId = useRef();

  useEffect(() => {
    let cancelled = false;

    if (!enabled || !provider || !contractAddress) {
      setLoading(false);
      setReady(false);
      return () => {
        cancelled = true;
      };
    }

    const shouldRefetch = lastAddress.current !== contractAddress || lastChainId.current !== chainId;
    if (!shouldRefetch && ready) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    lastAddress.current = contractAddress;
    lastChainId.current = chainId;

    provider
      .getCode(contractAddress)
      .then((bytecode) => {
        if (cancelled) return;
        const ok = isNonEmptyBytecode(bytecode);
        setReady(ok);
        setLoading(false);
        if (!ok) {
          log.warn('Contract code missing', { contractAddress, chainId });
        }
      })
      .catch((error) => {
        if (cancelled) return;
        log.error('Contract availability check failed', error);
        setReady(false);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, provider, contractAddress, chainId]);

  return { ready, loading };
}
