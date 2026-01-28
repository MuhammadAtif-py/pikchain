import { useState } from "react";
import confi from "../contract/Config.json";
import Abi from "../contract/Abi.json";
import {
  useAccount,
  useContractRead,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
  useNetwork,
} from "wagmi";
import { useConnect, useDisconnect } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { getCache, setCache, CACHE_KEYS, invalidateCacheForAddress } from "../utils/cache";
import {
  resolveTargetChainId,
  isSupportedChain,
  getSwitchHint,
} from "../utils/networks";

export default function Settings() {
  const inputProps = useInput();
  const { connect, isLoading: connecting } = useConnect({ connector: new MetaMaskConnector() });
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const TARGET_CHAIN_ID = resolveTargetChainId(chain?.id);
  const networkConfig = confi.NETWORKS?.[TARGET_CHAIN_ID.toString()];
  const contractAddress = networkConfig?.CONTRACT_ADDRESS || confi.CONTRACT_ADDRESS;
  const networkReady = chain?.id === TARGET_CHAIN_ID && isSupportedChain(chain?.id);
  const switchHint = getSwitchHint(TARGET_CHAIN_ID);
  const needsSwitch = Boolean(chain?.id) && !networkReady;
  
  // Cache state
  const [cachedUsername, setCachedUsername] = useState(() =>
    getCache(CACHE_KEYS.USERNAME(address, TARGET_CHAIN_ID)) || ''
  );
  
  const { config } = usePrepareContractWrite({
    address: contractAddress,
    abi: Abi,
    functionName: "setUsername",
    args: [inputProps.value],
    chainId: TARGET_CHAIN_ID,
    enabled: networkReady && Boolean(inputProps.value),
  });
  const { data, write } = useContractWrite(config);
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: () => {
      // Invalidate cache on successful username change
      invalidateCacheForAddress(address, TARGET_CHAIN_ID);
    },
  });

  function useInput(defaultValue) {
    const [value, setValue] = useState(defaultValue);
    function onChange(e) {
      setValue(e.target.value);
    }
    return {
      value,
      onChange,
    };
  }

  const { data: userName, isError } = useContractRead({
    address: contractAddress,
    abi: Abi,
    functionName: "getUsername",
    overrides: address ? { from: address } : undefined,
    watch: true,
    enabled: networkReady && isConnected,
    chainId: TARGET_CHAIN_ID,
    onSuccess: (data) => {
      if (data) {
        setCache(CACHE_KEYS.USERNAME(address, TARGET_CHAIN_ID), data);
        setCachedUsername(data);
      }
    },
  });
  
  // Use cached username on RPC error
  const displayName = isError ? cachedUsername : (userName || cachedUsername);
  return (
    <div className="flex flex-col items-center justify-center h-screen ">
      <h1 className="pb-8 text-3xl font-bold text-teal-400">PROFILE SETTING</h1>
      {isConnected ? (
        <div className="flex flex-col items-center justify-center gap-4 w-md">
          <button
            onClick={() => disconnect()}
            className="self-end px-3 py-1 text-xs rounded bg-gradient-to-r from-teal-600 to-fuchsia-600"
          >
            Disconnect
          </button>
          <h1 className="text-xl">{displayName || 'No username set'}</h1>
          <input
            // eslint-disable-next-line react/no-unknown-property
            variant="static"
            label="username"
            className="p-2 border-2 border-teal-600 rounded-xl text-slate-500"
            {...inputProps}
            placeholder=" new username"
          />
          <span className="text-xs opacity-60">
            hint:empty value will remove the username
          </span>
          <button
            className="p-2 px-5 rounded bg-gradient-to-r hover:bg-gradient-to-l disabled:cursor-not-allowed from-teal-600 to-fuchsia-600 "
            disabled={!networkReady || !write || isLoading}
            onClick={() => write?.()}
          >
            {isLoading ? "please wait....." : "Set new User Name ⟩⟩"}
          </button>
          {isLoading && (
            <div> Setting new User Name... please Check your Wallet</div>
          )}
          {isSuccess && (
            <div className="flex flex-col items-center justify-center gap-4">
              <h1>New User Name Set Successfully</h1>
              <div>
                <a
                  href={`https://amoy.polygonscan.com/tx/${data?.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-center bg-green-500 rounded-2xl"
                >
                  View on Polygonscan
                </a>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <h1> Please Connect Your wallet </h1>
          <button
            onClick={() => connect()}
            disabled={connecting}
            className="px-4 py-2 rounded bg-gradient-to-r from-teal-600 to-fuchsia-600 disabled:opacity-50"
          >
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          {needsSwitch && (
            <span className="text-xs text-orange-400">Wrong network selected. Switch to {switchHint}.</span>
          )}
        </div>
      )}
    </div>
  );
}
