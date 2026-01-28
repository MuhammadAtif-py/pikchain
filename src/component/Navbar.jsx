import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from "wagmi";
import log from '../utils/logger';
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { Link } from "react-router-dom";
import Profile from "./Profile";
import logo from "../assets/photobloc_klogo.svg";
import github from "../assets/github.svg";
import confi from "../contract/Config.json";
import { useAuth } from "../context/AuthContext";
import {
  resolveTargetChainId,
  isSupportedChain,
  getSwitchHint,
} from "../utils/networks";

export default function Navbar() {
  const scanlink = confi.SCAN_LINK;
  const { isConnected, address } = useAccount();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: switching } = useSwitchNetwork();
  const { isAuthenticated, user, signOut, isConfigured } = useAuth();
  
  const TARGET_CHAIN_ID = resolveTargetChainId(chain?.id);
  const wrongNetwork = !!chain && !isSupportedChain(chain.id);
  const switchHint = getSwitchHint(TARGET_CHAIN_ID);
  
  const { connect, isLoading: connecting } = useConnect({ connector: new MetaMaskConnector(), onSuccess(data){ log.info('Connected', { address: data.account }); }, onError(err){ log.error('Connect error', err); } });
  const { disconnect } = useDisconnect();

  const short = (addr) => addr && `${addr.slice(0,6)}...${addr.slice(-4)}`;
  
  const handleSignOut = async () => {
    await signOut();
    log.info('User signed out');
  };

  return (
    <div className="sticky top-0 flex flex-col w-full h-auto bg-transparent backdrop-blur z-50">
      {wrongNetwork && (
        <div className="w-full px-4 py-1 text-xs text-center text-black bg-gradient-to-r from-yellow-300 to-orange-400">
          Wrong network selected ({chain?.name || chain?.id}). Please switch to {switchHint}.
          {switchNetwork && (
            <button
              onClick={() => switchNetwork(TARGET_CHAIN_ID)}
              disabled={switching}
              className="px-2 py-0.5 ml-3 text-white rounded bg-gradient-to-r from-teal-600 to-fuchsia-600 disabled:opacity-60"
            >
              {switching ? 'Switching...' : `Switch to ${switchHint}`}
            </button>
          )}
        </div>
      )}
      <div className="flex items-center justify-between w-full h-auto p-2">
      <div>
        <Link to="/" className="flex scale-150 animate-bounce">
          <img src={logo} width={40} />
        </Link>
      </div>
      <div>
        <div className="flex items-center justify-center gap-6">
          <Link to="/" className="text-teal-500 hover:text-fuchsia-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
          </Link>
          <Link to="https://github.com/dcryptoniun/photoblock" target="blank">
            <img
              className="bg-teal-500 rounded-full hover:bg-fuchsia-500"
              src={github}
              width={20}
              alt="github link"
            />
          </Link>
          <Link
            to={scanlink}
            target="blank"
            className="text-teal-500 hover:text-fuchsia-500"
          >
            Contract
          </Link>
          <Link to="/history" className="text-teal-500 hover:text-fuchsia-500">
            History
          </Link>
          <Link to="/analytics" className="text-teal-500 hover:text-fuchsia-500">
            Analytics
          </Link>
          <Link to="/explorer" className="text-teal-500 hover:text-fuchsia-500">
            Chain
          </Link>
          <Link to="/settings">
            <Profile />
          </Link>

          {/* Auth Buttons */}
          {isConfigured && (
            isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="text-xs text-teal-400 hover:text-fuchsia-400">
                  {user?.email?.split('@')[0]}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="px-2 py-1 text-xs rounded border border-zinc-600 hover:bg-zinc-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1 text-xs rounded border border-teal-500 text-teal-400 hover:bg-teal-500/20"
              >
                Sign In
              </Link>
            )
          )}

          {isConnected ? (
            <button
              onClick={() => { log.info('Disconnect'); disconnect(); }}
              className="px-3 py-1 text-xs rounded bg-gradient-to-r from-teal-600 to-fuchsia-600 hover:from-teal-500 hover:to-fuchsia-500"
            >
              {short(address)} ✕
            </button>
          ) : (
            <button
              onClick={() => { log.info('Connect requested'); connect(); }}
              disabled={connecting}
              className="px-3 py-1 text-xs rounded bg-gradient-to-r from-teal-600 to-fuchsia-600 disabled:opacity-50"
            >
              {connecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
