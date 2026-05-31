"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAccount, useProvider } from "@starknet-start/react";
import { 
  PlusIcon, 
  TrashIcon, 
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  WalletIcon,
  CircleStackIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  DocumentDuplicateIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";

// Preloaded Tokens Details
interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  label: string;
  isCustom?: boolean;
}

const PRELOADED_TOKENS: TokenInfo[] = [
  { address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7", symbol: "ETH", decimals: 18, label: "Ethereum" },
  { address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d", symbol: "STRK", decimals: 18, label: "Starknet Token" },
  { address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8", symbol: "USDC", decimals: 6, label: "USD Coin" },
  { address: "0x0124aeb495b747201f3140103de5d20b6e3fcfcf8fbdf9d1d17d5c7c77c4f621", symbol: "LORDS", decimals: 18, label: "Lords (Realms)" },
  { address: "0x0da114eb680457337696c34812f21a981c9a6cc94187f4c202c49924d5d5ecb", symbol: "DAI", decimals: 18, label: "Dai Stablecoin" }
];

// Preloaded NFTs Details
interface NFTInfo {
  id: string;
  name: string;
  collection: string;
  imageUrl: string;
  contractAddress: string;
  tokenId: string;
  isCustom?: boolean;
}

const PRELOADED_NFTS: NFTInfo[] = [
  { id: "p1", name: "Starknet Quest Explorer #452", collection: "Starknet Quest", imageUrl: "https://starknet.quest/assets/quests/starknetid/quest.png", contractAddress: "0x05dbcf33f2bb2e4cfafab92d021c64264d90071c261e4737d2a55a79ee6fc49e", tokenId: "452" },
  { id: "p2", name: "Everai Knight #8821", collection: "The Everai", imageUrl: "https://i.imgur.com/83pZszM.png", contractAddress: "0x013c767676767676767676767676767676767676767676767676767676767676", tokenId: "8821" },
  { id: "p3", name: "Starknet.id Domain: portfolio.stark", collection: "Starknet ID", imageUrl: "https://i.imgur.com/GjT8S0I.png", contractAddress: "0x05dbcf33f2bb2e4cfafab92d021c64264d90071c261e4737d2a55a79ee6fc49e", tokenId: "998212" },
  { id: "p4", name: "Briq Castle Block", collection: "Briq", imageUrl: "https://i.imgur.com/WdG91bH.png", contractAddress: "0x014c878787878787878787878787878787878787878787878787878787878787", tokenId: "1098" }
];

const Home = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const { provider } = useProvider();
  
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<"tokens" | "nfts">("tokens");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Profile-specific storage (persisted uniquely for the connected address)
  const [secondaryAddresses, setSecondaryAddresses] = useState<string[]>([]);
  const [customTokens, setCustomTokens] = useState<TokenInfo[]>([]);
  const [customNFTs, setCustomNFTs] = useState<NFTInfo[]>([]);

  // Forms
  const [newSecAddress, setNewSecAddress] = useState("");
  const [newTokenAddress, setNewTokenAddress] = useState("");
  const [newTokenSymbol, setNewTokenSymbol] = useState("");
  const [newTokenDecimals, setNewTokenDecimals] = useState(18);
  const [newNFTAddress, setNewNFTAddress] = useState("");
  const [newNFTTokenId, setNewNFTTokenId] = useState("");
  const [newNFTName, setNewNFTName] = useState("");

  // Aggregate Balances State: Record<address, Record<tokenSymbol, balanceNumber>>
  const [balances, setBalances] = useState<Record<string, Record<string, number>>>({});

  // Market Prices (Standard ones fetched dynamically from CoinGecko or fallback)
  const [prices, setPrices] = useState<Record<string, number>>({
    ETH: 3250.40,
    STRK: 1.28,
    USDC: 1.00,
    LORDS: 0.18,
    DAI: 1.00
  });

  // Calculate lists of active trackers
  const allAddresses = useMemo(() => connectedAddress 
    ? [connectedAddress, ...secondaryAddresses] 
    : secondaryAddresses, [connectedAddress, secondaryAddresses]);

  const allTokens = useMemo(() => [...PRELOADED_TOKENS, ...customTokens], [customTokens]);

  // Load custom portfolio data segmented by connectedAddress
  useEffect(() => {
    if (!connectedAddress) return;
    
    const key = `starknet_portfolio_${connectedAddress.toLowerCase()}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSecondaryAddresses(parsed.secondaryAddresses || []);
        setCustomTokens(parsed.customTokens || []);
        setCustomNFTs(parsed.customNFTs || []);
      } catch (e) {
        console.error("Error loading portfolio layout", e);
      }
    } else {
      setSecondaryAddresses([]);
      setCustomTokens([]);
      setCustomNFTs([]);
    }

    // Try fetching live token prices from CoinGecko
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=starknet,ethereum,usd-coin,lords,dai&vs_currencies=usd")
      .then(res => res.json())
      .then(data => {
        setPrices(prev => ({
          ...prev,
          ETH: data.ethereum?.usd || prev.ETH,
          STRK: data.starknet?.usd || prev.STRK,
          USDC: data["usd-coin"]?.usd || prev.USDC,
          LORDS: data.lords?.usd || prev.LORDS,
          DAI: data.dai?.usd || prev.DAI
        }));
      })
      .catch(() => {
        // Fallback silently to static preloaded prices
      });
  }, [connectedAddress]);

  // Sync custom changes back to localStorage
  const syncToLocalStorage = (newSec: string[], newTokens: TokenInfo[], newNfts: NFTInfo[]) => {
    if (!connectedAddress) return;
    const key = `starknet_portfolio_${connectedAddress.toLowerCase()}`;
    localStorage.setItem(key, JSON.stringify({
      secondaryAddresses: newSec,
      customTokens: newTokens,
      customNFTs: newNfts
    }));
  };

  const fetchStarknetBalance = async (prov: any, token: string, user: string) => {
    const tryCall = async (entrypoint: string) => {
      try {
        const res = await prov.callContract({
          contractAddress: token,
          entrypoint: entrypoint,
          calldata: [user]
        });
        const result = res && res.result ? res.result : res;
        if (result && Array.isArray(result)) {
          if (result.length >= 2) {
            const low = BigInt(result[0]);
            const high = BigInt(result[1]);
            return (high << 128n) + low;
          } else if (result.length === 1) {
            return BigInt(result[0]);
          }
        }
        return null;
      } catch (e) {
        return null;
      }
    };

    let bal = await tryCall("balance_of");
    if (bal === null) {
      bal = await tryCall("balanceOf");
    }
    return bal ?? 0n;
  };

  // Fetch balances across all tracked wallets and all tokens
  const fetchAllBalances = useCallback(async () => {
    if (allAddresses.length === 0 || !provider) return;
    setIsLoading(true);
    const newBalances: Record<string, Record<string, number>> = {};

    try {
      for (const wallet of allAddresses) {
        newBalances[wallet] = {};
        for (const token of allTokens) {
          try {
            const rawBal = await fetchStarknetBalance(provider, token.address, wallet);
            newBalances[wallet][token.symbol] = parseFloat((Number(rawBal) / Math.pow(10, token.decimals)).toFixed(5));
          } catch {
            newBalances[wallet][token.symbol] = 0;
          }
        }
      }
      setBalances(newBalances);
    } catch (e) {
      console.error("Error fetching balances", e);
    } finally {
      setIsLoading(false);
    }
  }, [allAddresses, allTokens, provider]);

  useEffect(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success("Address copied to clipboard!");
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Add Secondary Address Handler
  const handleAddSecondaryAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) {
      toast.error("Connect your main wallet first!");
      return;
    }

    const cleaned = newSecAddress.trim().toLowerCase();
    if (!/^0x[0-9a-fA-F]{1,64}$/.test(cleaned)) {
      toast.error("Invalid address format! Must be 0x followed by hex.");
      return;
    }

    let formatted = cleaned;
    if (cleaned.length < 66) {
      const hexPart = cleaned.slice(2);
      formatted = "0x" + hexPart.padStart(64, "0");
    }

    if (allAddresses.some(addr => addr.toLowerCase() === formatted.toLowerCase())) {
      toast.error("This address is already tracked!");
      return;
    }

    const updatedSec = [...secondaryAddresses, formatted];
    setSecondaryAddresses(updatedSec);
    syncToLocalStorage(updatedSec, customTokens, customNFTs);
    setNewSecAddress("");
    toast.success("Wallet address added to tracking!");
  };

  // Remove Secondary Address
  const handleRemoveSecondaryAddress = (addrToRemove: string) => {
    const updatedSec = secondaryAddresses.filter(addr => addr !== addrToRemove);
    setSecondaryAddresses(updatedSec);
    syncToLocalStorage(updatedSec, customTokens, customNFTs);
    toast.success("Wallet address removed");
  };

  // Add Custom Token Handler
  const handleAddCustomToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) return;

    const addressCleaned = newTokenAddress.trim().toLowerCase();
    const symbolCleaned = newTokenSymbol.trim().toUpperCase();

    if (!/^0x[0-9a-fA-F]{1,64}$/.test(addressCleaned)) {
      toast.error("Invalid token contract address.");
      return;
    }
    if (!symbolCleaned) {
      toast.error("Please enter a token symbol.");
      return;
    }

    if (allTokens.some(t => t.symbol === symbolCleaned || t.address.toLowerCase() === addressCleaned)) {
      toast.error("This token is already in your tracker!");
      return;
    }

    const newTok: TokenInfo = {
      address: addressCleaned,
      symbol: symbolCleaned,
      decimals: newTokenDecimals,
      label: `${symbolCleaned} (Custom)`,
      isCustom: true
    };

    const updatedTokens = [...customTokens, newTok];
    setCustomTokens(updatedTokens);
    syncToLocalStorage(secondaryAddresses, updatedTokens, customNFTs);
    setPrices(prev => ({ ...prev, [symbolCleaned]: 1.00 }));
    
    setNewTokenAddress("");
    setNewTokenSymbol("");
    setNewTokenDecimals(18);
    toast.success(`Custom token ${symbolCleaned} added successfully!`);
  };

  // Remove Custom Token
  const handleRemoveCustomToken = (symbol: string) => {
    const updatedTokens = customTokens.filter(t => t.symbol !== symbol);
    setCustomTokens(updatedTokens);
    syncToLocalStorage(secondaryAddresses, updatedTokens, customNFTs);
    toast.success("Custom token removed");
  };

  // Add Custom NFT Handler
  const handleAddCustomNFT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) return;

    const nftAddr = newNFTAddress.trim().toLowerCase();
    const tokId = newNFTTokenId.trim();
    const name = newNFTName.trim() || `Custom NFT #${tokId}`;

    if (!/^0x[0-9a-fA-F]{1,64}$/.test(nftAddr)) {
      toast.error("Invalid NFT contract address.");
      return;
    }
    if (!tokId) {
      toast.error("Please enter a Token ID.");
      return;
    }

    const newNftItem: NFTInfo = {
      id: `c_${Date.now()}`,
      name,
      collection: "Custom Collection",
      imageUrl: "https://starknet.quest/assets/quests/starknetid/quest.png", 
      contractAddress: nftAddr,
      tokenId: tokId,
      isCustom: true
    };

    const updatedNfts = [...customNFTs, newNftItem];
    setCustomNFTs(updatedNfts);
    syncToLocalStorage(secondaryAddresses, customTokens, updatedNfts);

    setNewNFTAddress("");
    setNewNFTTokenId("");
    setNewNFTName("");
    toast.success("Custom NFT added to showcase!");
  };

  // Remove Custom NFT
  const handleRemoveCustomNFT = (idToRemove: string) => {
    const updatedNfts = customNFTs.filter(nft => nft.id !== idToRemove);
    setCustomNFTs(updatedNfts);
    syncToLocalStorage(secondaryAddresses, customTokens, updatedNfts);
    toast.success("Custom NFT removed");
  };

  // Calculations
  const tokenTotals = allTokens.reduce((acc, token) => {
    let totalAmt = 0;
    allAddresses.forEach(wallet => {
      totalAmt += (balances[wallet]?.[token.symbol] || 0);
    });
    acc[token.symbol] = totalAmt;
    return acc;
  }, {} as Record<string, number>);

  const totalUSDValue = allTokens.reduce((sum, token) => {
    const amt = tokenTotals[token.symbol] || 0;
    const price = prices[token.symbol] || 0;
    return sum + (amt * price);
  }, 0);

  return (
    <div className="flex-grow text-slate-100 min-h-screen relative w-full overflow-hidden">
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: "rgba(15, 23, 42, 0.9)",
          color: "#fff",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          backdropFilter: "blur(12px)",
          borderRadius: "1rem"
        }
      }} />
      
      {/* Background Gradient & Animated Mesh Lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-700/10 blur-[160px] rounded-full pointer-events-none animate-pulse duration-10000"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/10 blur-[180px] rounded-full pointer-events-none"></div>

      {/* Main Connection Screen Wrapper */}
      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-28 text-center max-w-xl mx-auto px-4 relative z-10">
          <div className="p-5 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 rounded-[2rem] border border-purple-500/20 mb-8 shadow-2xl relative group">
            <div className="absolute inset-0 bg-purple-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <WalletIcon className="w-16 h-16 text-purple-400 relative z-10 animate-bounce duration-3000" />
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight mb-3">
            Your Starknet Wealth, Unified.
          </h2>
          <p className="text-slate-400 text-base mb-10 max-w-md">
            Connect your primary Starknet wallet to securely aggregate, track, and showcase multi-wallet balances & NFTs on Starknet Mainnet.
          </p>
          <div className="w-full px-6 py-5 bg-slate-950/40 border border-slate-800/80 backdrop-blur-md rounded-2xl text-xs text-left text-slate-400 flex items-start gap-3 shadow-inner">
            <span className="text-xl">✨</span>
            <div>
              <strong className="text-slate-200 block mb-1">Decentralized Profile Storage</strong>
              Tracked addresses, custom tokens, and NFT configurations are automatically bound directly to your wallet identity via secure localized profiles.
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 relative z-10">
          {/* Header Dashboard Control Panel */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400">Live Mainnet RPC Enabled</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Starknet Multi-Address Tracker
              </h1>
              <div className="flex items-center gap-2 mt-3 bg-slate-900/60 border border-slate-800/80 rounded-full px-3 py-1.5 w-fit shadow-lg">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Anchor Address:</span>
                <span className="text-xs font-mono text-slate-300">
                  {connectedAddress ? `${connectedAddress.slice(0, 10)}...${connectedAddress.slice(-8)}` : ""}
                </span>
                <button 
                  onClick={() => connectedAddress && handleCopy(connectedAddress)}
                  className="p-1 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  {copiedText === connectedAddress ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <DocumentDuplicateIcon className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button
                onClick={fetchAllBalances}
                disabled={isLoading}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 rounded-2xl text-xs font-bold transition-all w-full lg:w-auto justify-center shadow-lg active:scale-95"
              >
                <ArrowPathIcon className={`w-4 h-4 text-purple-400 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Synchronizing Chain Data..." : "Force Real-time Sync"}
              </button>
            </div>
          </div>

          {/* Core Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* LEFT COLUMN: Overview & Addresses */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              
              {/* Premium Aggregate Net Worth Card */}
              <div className="bg-slate-950/40 backdrop-blur-2xl border border-slate-800/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-[2rem] p-6 hover:border-purple-500/20 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-indigo-500/0 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-purple-400 flex items-center gap-2">
                    <WalletIcon className="w-4 h-4" />
                    Total Net Worth
                  </span>
                  <span className="text-[10px] bg-purple-500/15 border border-purple-500/20 text-purple-300 font-bold px-2.5 py-1 rounded-full">
                    {allAddresses.length} {allAddresses.length === 1 ? "Wallet" : "Wallets"} Tracked
                  </span>
                </div>

                <div className="mb-6">
                  <div className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-slate-400">$</span>
                    {totalUSDValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-2 block font-medium">Aggregated real-time token balances</span>
                </div>

                {/* Horizontal Asset Allocation Visualization */}
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex shadow-inner">
                  {totalUSDValue > 0 ? allTokens.map((token, index) => {
                    const amt = tokenTotals[token.symbol] || 0;
                    const val = amt * (prices[token.symbol] || 0);
                    const pct = (val / totalUSDValue) * 100;
                    if (pct === 0) return null;
                    
                    const colors = ["bg-cyan-400", "bg-purple-500", "bg-emerald-400", "bg-indigo-400", "bg-amber-400"];
                    const color = colors[index % colors.length];

                    return (
                      <div 
                        key={token.symbol} 
                        className={color} 
                        style={{ width: `${pct}%` }}
                        title={`${token.symbol}: ${pct.toFixed(1)}%`}
                      ></div>
                    );
                  }) : <div className="bg-slate-800 w-full"></div>}
                </div>
              </div>

              {/* Address Registry Box */}
              <div className="bg-slate-950/40 backdrop-blur-2xl border border-slate-800/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-[2rem] p-6 hover:border-purple-500/20 transition-all duration-300">
                <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2.5">
                  <CircleStackIcon className="w-5 h-5 text-cyan-400" />
                  Address Registry
                </h3>

                <div className="space-y-3.5 mb-6 max-h-[300px] overflow-y-auto pr-1">
                  {/* Connected Anchor Wallet */}
                  <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 flex justify-between items-center hover:border-purple-500/30 transition-all">
                    <div>
                      <span className="text-xs font-black text-purple-300 block mb-1">Primary Wallet</span>
                      <span className="text-[10px] text-slate-400 font-mono">{connectedAddress ? `${connectedAddress.slice(0, 16)}...${connectedAddress.slice(-10)}` : ""}</span>
                    </div>
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Anchor</span>
                  </div>

                  {/* Secondary Wallets */}
                  {secondaryAddresses.map((addr) => (
                    <div key={addr} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 flex justify-between items-center group hover:border-slate-700 transition-all">
                      <div>
                        <span className="text-xs font-bold text-slate-300 block mb-1">Linked Wallet</span>
                        <span className="text-[10px] text-slate-400 font-mono">{`${addr.slice(0, 16)}...${addr.slice(-10)}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleCopy(addr)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all"
                          title="Copy Address"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRemoveSecondaryAddress(addr)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove Wallet"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Secondary Address Form */}
                <form onSubmit={handleAddSecondaryAddress} className="pt-5 border-t border-slate-900">
                  <label className="text-xs text-slate-400 font-bold block mb-2 uppercase tracking-wide">Link Additional Address</label>
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      placeholder="0x04718..."
                      value={newSecAddress}
                      onChange={(e) => setNewSecAddress(e.target.value)}
                      className="bg-slate-900/80 rounded-2xl px-4 py-3 text-xs border border-slate-800 focus:border-purple-500/50 text-white placeholder-slate-600 focus:outline-none flex-grow shadow-inner transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl text-white hover:opacity-90 active:scale-95 transition-all flex justify-center items-center shadow-lg"
                      title="Link Wallet"
                    >
                      <PlusIcon className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* RIGHT COLUMN: Interactive Tabs (Tokens / NFTs) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Tab Selector Bar */}
              <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded-2xl border border-slate-800/60 shadow-lg w-fit">
                <button
                  onClick={() => setActiveTab("tokens")}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs font-extrabold tracking-wider transition-all justify-center ${
                    activeTab === "tokens"
                      ? "bg-slate-900 text-white border border-slate-800 shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <CurrencyDollarIcon className="w-4 h-4 text-purple-400" />
                  Tokens Breakdown
                </button>
                <button
                  onClick={() => setActiveTab("nfts")}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs font-extrabold tracking-wider transition-all justify-center ${
                    activeTab === "nfts"
                      ? "bg-slate-900 text-white border border-slate-800 shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <PhotoIcon className="w-4 h-4 text-cyan-400" />
                  NFTs Showcase
                </button>
              </div>

              {/* TAB CONTENT: TOKENS */}
              {activeTab === "tokens" && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Tokens Balance list */}
                  <div className="bg-slate-950/40 backdrop-blur-2xl border border-slate-800/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-[2rem] p-6 hover:border-purple-500/20 transition-all duration-300">
                    <h3 className="text-base font-bold text-white mb-6">Tracked Assets Breakdown</h3>
                    
                    <div className="space-y-3.5">
                      {allTokens.map((token, index) => {
                        const amt = tokenTotals[token.symbol] || 0;
                        const tokenUSD = amt * (prices[token.symbol] || 0);
                        const colors = ["bg-cyan-400", "bg-purple-500", "bg-emerald-400", "bg-indigo-400", "bg-amber-400"];
                        const indicatorColor = colors[index % colors.length];

                        return (
                          <div 
                            key={token.symbol}
                            className="p-4.5 rounded-2xl bg-slate-900/20 border border-slate-800/40 hover:border-slate-700/50 hover:bg-slate-900/30 transition-all flex justify-between items-center group"
                          >
                            <div className="flex items-center gap-3.5">
                              <div className={`w-2.5 h-2.5 rounded-full ${indicatorColor} shadow-lg`}></div>
                              <div>
                                <span className="font-black text-white text-sm block mb-0.5">{token.symbol}</span>
                                <span className="text-[10px] text-slate-400 font-medium">{token.label}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm font-black text-white tracking-tight">{amt.toLocaleString(undefined, { maximumFractionDigits: 5 })}</div>
                                <div className="text-xs text-slate-400 font-bold mt-0.5">${tokenUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>

                              {token.isCustom ? (
                                <button
                                  onClick={() => handleRemoveCustomToken(token.symbol)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                  title="Delete custom token"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              ) : (
                                <a 
                                  href={`https://starkscan.co/token/${token.address}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-all"
                                  title="View on Explorer"
                                >
                                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Custom Token Form */}
                  <div className="bg-slate-950/40 backdrop-blur-2xl border border-slate-800/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-[2rem] p-6 hover:border-purple-500/20 transition-all duration-300">
                    <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                      <PlusIcon className="w-5 h-5 text-purple-400" />
                      Add Custom Starknet Token
                    </h3>

                    <form onSubmit={handleAddCustomToken} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="text-xs text-slate-400 font-bold block mb-2 uppercase tracking-wide">Contract Address</label>
                        <input
                          type="text"
                          placeholder="0x049d365..."
                          value={newTokenAddress}
                          onChange={(e) => setNewTokenAddress(e.target.value)}
                          className="w-full bg-slate-900/80 rounded-2xl px-4 py-3 text-xs border border-slate-800 focus:border-purple-500/50 text-white placeholder-slate-600 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-bold block mb-2 uppercase tracking-wide">Symbol</label>
                        <input
                          type="text"
                          placeholder="e.g. LORDS"
                          value={newTokenSymbol}
                          onChange={(e) => setNewTokenSymbol(e.target.value)}
                          className="w-full bg-slate-900/80 rounded-2xl px-4 py-3 text-xs border border-slate-800 focus:border-purple-500/50 text-white placeholder-slate-600 focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="flex gap-2.5">
                        <div className="flex-grow">
                          <label className="text-xs text-slate-400 font-bold block mb-2 uppercase tracking-wide">Decimals</label>
                          <input
                            type="number"
                            value={newTokenDecimals}
                            onChange={(e) => setNewTokenDecimals(parseInt(e.target.value) || 18)}
                            className="w-full bg-slate-900/80 rounded-2xl px-4 py-3 text-xs border border-slate-800 focus:border-purple-500/50 text-white focus:outline-none transition-colors"
                          />
                        </div>
                        <button
                          type="submit"
                          className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl text-white hover:opacity-90 active:scale-95 transition-all flex justify-center items-center shadow-lg"
                          title="Register Token"
                        >
                          <PlusIcon className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: NFTS */}
              {activeTab === "nfts" && (
                <div className="space-y-8 animate-fadeIn">
                  {/* NFT Gallery Grid */}
                  <div className="bg-slate-950/40 backdrop-blur-2xl border border-slate-800/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-[2rem] p-6 hover:border-purple-500/20 transition-all duration-300">
                    <h3 className="text-base font-bold text-white mb-6">Portfolio NFT Gallery</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Offered Preloaded NFTs */}
                      {PRELOADED_NFTS.map((nft) => (
                        <div key={nft.id} className="rounded-3xl border border-slate-800/60 overflow-hidden bg-slate-900/10 flex flex-col group relative hover:border-slate-700 transition-all duration-300 shadow-md">
                          <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                            <img src={nft.imageUrl} alt={nft.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                            <span className="absolute top-3 left-3 text-[9px] tracking-wider uppercase font-black px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-full backdrop-blur-md">Featured Collection</span>
                          </div>
                          <div className="p-5 flex-grow flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wide">{nft.collection}</span>
                              <h4 className="text-sm font-extrabold text-white mt-1.5 mb-3">{nft.name}</h4>
                            </div>
                            <div className="flex justify-between items-center pt-3.5 border-t border-slate-900 text-[10px] font-mono text-slate-400">
                              <span>Token ID: #{nft.tokenId}</span>
                              <a href={`https://starkscan.co/nft/${nft.contractAddress}/${nft.tokenId}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                                Explorer <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Custom NFTs */}
                      {customNFTs.map((nft) => (
                        <div key={nft.id} className="rounded-3xl border border-slate-800/60 overflow-hidden bg-slate-900/10 flex flex-col group relative hover:border-slate-700 transition-all duration-300 shadow-md">
                          <div className="relative h-48 w-full bg-slate-950 flex justify-center items-center overflow-hidden">
                            <img src={nft.imageUrl} alt={nft.name} className="object-cover w-full h-full opacity-60 group-hover:scale-105 transition-transform duration-500" />
                            <span className="absolute top-3 left-3 text-[9px] tracking-wider uppercase font-black px-2.5 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full backdrop-blur-md">Custom Tracked</span>
                            <button
                              onClick={() => handleRemoveCustomNFT(nft.id)}
                              className="absolute top-3 right-3 p-2 rounded-xl bg-red-500/25 border border-red-500/30 hover:bg-red-600 hover:text-white text-red-400 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"
                              title="Remove Custom NFT"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-5 flex-grow flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wide">{nft.collection}</span>
                              <h4 className="text-sm font-extrabold text-white mt-1.5 mb-3">{nft.name}</h4>
                            </div>
                            <div className="flex justify-between items-center pt-3.5 border-t border-slate-900 text-[10px] font-mono text-slate-400">
                              <span>Token ID: #{nft.tokenId}</span>
                              <a href={`https://starkscan.co/nft/${nft.contractAddress}/${nft.tokenId}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                                Explorer <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Custom NFT Form */}
                  <div className="bg-slate-950/40 backdrop-blur-2xl border border-slate-800/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-[2rem] p-6 hover:border-purple-500/20 transition-all duration-300">
                    <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                      <PlusIcon className="w-5 h-5 text-purple-400" />
                      Add Custom Starknet NFT
                    </h3>

                    <form onSubmit={handleAddCustomNFT} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="text-xs text-slate-400 font-bold block mb-2 uppercase tracking-wide">Contract Address</label>
                        <input
                          type="text"
                          placeholder="0x05dbcf..."
                          value={newNFTAddress}
                          onChange={(e) => setNewNFTAddress(e.target.value)}
                          className="w-full bg-slate-900/80 rounded-2xl px-4 py-3 text-xs border border-slate-800 focus:border-purple-500/50 text-white placeholder-slate-600 focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-bold block mb-2 uppercase tracking-wide">Token ID</label>
                        <input
                          type="text"
                          placeholder="e.g. 452"
                          value={newNFTTokenId}
                          onChange={(e) => setNewNFTTokenId(e.target.value)}
                          className="w-full bg-slate-900/80 rounded-2xl px-4 py-3 text-xs border border-slate-800 focus:border-purple-500/50 text-white placeholder-slate-600 focus:outline-none transition-colors"
                        />
                      </div>
                      <div className="flex gap-2.5">
                        <div className="flex-grow">
                          <label className="text-xs text-slate-400 font-bold block mb-2 uppercase tracking-wide">Custom NFT Name</label>
                          <input
                            type="text"
                            placeholder="Quest Shield"
                            value={newNFTName}
                            onChange={(e) => setNewNFTName(e.target.value)}
                            className="w-full bg-slate-900/80 rounded-2xl px-4 py-3 text-xs border border-slate-800 focus:border-purple-500/50 text-white placeholder-slate-600 focus:outline-none transition-colors"
                          />
                        </div>
                        <button
                          type="submit"
                          className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl text-white hover:opacity-90 active:scale-95 transition-all flex justify-center items-center shadow-lg"
                          title="Track NFT"
                        >
                          <PlusIcon className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
