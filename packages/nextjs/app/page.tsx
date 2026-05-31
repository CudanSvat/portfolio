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
    toast.success("Address copied!");
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
    toast.success("Wallet linked successfully!");
  };

  // Remove Secondary Address
  const handleRemoveSecondaryAddress = (addrToRemove: string) => {
    const updatedSec = secondaryAddresses.filter(addr => addr !== addrToRemove);
    setSecondaryAddresses(updatedSec);
    syncToLocalStorage(updatedSec, customTokens, customNFTs);
    toast.success("Wallet link removed");
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
    <div className="w-full min-h-screen bg-[#070913] text-[#F3F4F6] relative overflow-hidden font-sans pb-20">
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: "rgba(10, 15, 30, 0.95)",
          color: "#F3F4F6",
          border: "1px solid rgba(139, 92, 246, 0.3)",
          backdropFilter: "blur(16px)",
          borderRadius: "1rem",
          fontWeight: 600,
        }
      }} />

      {/* Modern Sci-Fi Ambient Glow Fields */}
      <div className="absolute top-[-25%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-gradient-to-tr from-purple-600/10 to-transparent blur-[160px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-cyan-500/10 to-transparent blur-[180px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[15%] w-[35vw] h-[35vw] rounded-full bg-violet-600/5 blur-[130px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-12 relative z-10">
        
        {/* Dynamic Futuristic Glass Header */}
        <div className="bg-[#0C0F1D]/80 border border-[#1E293B]/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 mb-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="text-[10px] tracking-widest font-black text-cyan-400 uppercase">Live Mainnet Blockchain RPC</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-none">
              Starknet Portfolio Tracker
            </h1>
            <p className="text-slate-400 text-xs mt-2 max-w-xl">
              Futuristic multi-address asset aggregation dashboard. Track real-time tokens, values, and NFTs from the Starknet network.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            {/* Connected Anchor Address capsule */}
            {connectedAddress && (
              <div className="flex items-center justify-between gap-3 bg-[#111827]/90 border border-[#1F2937] rounded-2xl px-4 py-3 shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-purple-400">Anchor Wallet</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {`${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}`}
                  </span>
                </div>
                <button 
                  onClick={() => handleCopy(connectedAddress)}
                  className="p-1.5 bg-[#1F2937] hover:bg-slate-700 rounded-xl text-slate-300 transition-all active:scale-90"
                  title="Copy Address"
                >
                  {copiedText === connectedAddress ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <DocumentDuplicateIcon className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <button
              onClick={fetchAllBalances}
              disabled={isLoading}
              className="flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-2xl text-xs font-extrabold shadow-[0_4px_20px_rgba(99,102,241,0.4)] active:scale-95 transition-all disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Synchronizing..." : "Refresh Dashboard"}
            </button>
          </div>
        </div>

        {/* Dashboard Grid Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT PANELS: Aggregate and Address Linked lists */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            
            {/* Aggregated Total Net Worth Card */}
            <div className="bg-gradient-to-b from-[#131A30] to-[#0A0E1A] border border-[#1E293B] shadow-[0_20px_40px_rgba(0,0,0,0.6)] rounded-3xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400 flex items-center gap-2">
                  <WalletIcon className="w-4 h-4 text-purple-400" />
                  Aggregate Portfolio
                </span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 font-extrabold px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-wide">
                  {allAddresses.length} Linked
                </span>
              </div>

              <div className="mb-6">
                <div className="text-xs text-slate-400 uppercase tracking-widest font-black mb-1">TOTAL NET WORTH</div>
                <div className="text-4xl md:text-5xl font-black text-white tracking-tight flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-cyan-400">$</span>
                  {totalUSDValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Progress Visualization per Asset */}
              <div className="space-y-3 pt-2">
                <div className="h-2 w-full bg-[#1F2937] rounded-full overflow-hidden flex shadow-inner">
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
                      ></div>
                    );
                  }) : <div className="bg-slate-800 w-full"></div>}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2">
                  {allTokens.map((token, index) => {
                    const amt = tokenTotals[token.symbol] || 0;
                    const val = amt * (prices[token.symbol] || 0);
                    const pct = totalUSDValue > 0 ? (val / totalUSDValue) * 100 : 0;
                    if (pct === 0) return null;
                    
                    const colors = ["bg-cyan-400", "bg-purple-500", "bg-emerald-400", "bg-indigo-400", "bg-amber-400"];
                    const dotColor = colors[index % colors.length];

                    return (
                      <div key={token.symbol} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                        <span>{token.symbol} ({pct.toFixed(0)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Address Registry Box */}
            <div className="bg-[#0C0F1D]/90 border border-[#1E293B] shadow-[0_20px_40px_rgba(0,0,0,0.6)] rounded-3xl p-6">
              <h3 className="text-sm uppercase tracking-widest font-black text-white mb-6 flex items-center gap-2">
                <CircleStackIcon className="w-5 h-5 text-cyan-400" />
                Linked Wallets
              </h3>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 mb-6">
                {/* Connected Wallet Row */}
                <div className="p-4 bg-purple-950/15 border border-purple-500/25 rounded-2xl flex justify-between items-center group">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-purple-400 block mb-0.5">Primary Connection</span>
                    <span className="text-xs font-mono font-bold text-slate-200">
                      {connectedAddress ? `${connectedAddress.slice(0, 14)}...${connectedAddress.slice(-8)}` : ""}
                    </span>
                  </div>
                  <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-black tracking-wider uppercase">Active</span>
                </div>

                {/* Secondary Wallets */}
                {secondaryAddresses.map((addr) => (
                  <div key={addr} className="p-4 bg-[#111827]/70 border border-[#1F2937] hover:border-slate-700 rounded-2xl flex justify-between items-center group transition-colors">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">Secondary Tracked</span>
                      <span className="text-xs font-mono font-bold text-slate-300">
                        {`${addr.slice(0, 14)}...${addr.slice(-8)}`}
                      </span>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleCopy(addr)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Copy"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRemoveSecondaryAddress(addr)}
                        className="p-1 text-slate-400 hover:text-red-400"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Secondary form */}
              <form onSubmit={handleAddSecondaryAddress} className="pt-5 border-t border-[#1E293B]">
                <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2">Link Another Starknet Wallet</label>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="0x04718..."
                    value={newSecAddress}
                    onChange={(e) => setNewSecAddress(e.target.value)}
                    className="bg-[#111827] border border-[#1F2937] focus:border-purple-500/50 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none flex-grow"
                  />
                  <button
                    type="submit"
                    className="px-3.5 bg-[#1F2937] hover:bg-[#374151] rounded-xl text-white active:scale-95 transition-all flex justify-center items-center shadow-lg border border-slate-700/50"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* RIGHT PANELS: Dynamic Token Breakdown or NFTs Showcase */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Glossy Tab Selector Bar */}
            <div className="flex items-center gap-2 bg-[#0C0F1D]/80 border border-[#1E293B] rounded-2xl p-1.5 w-fit shadow-2xl">
              <button
                onClick={() => setActiveTab("tokens")}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black tracking-wider transition-all ${
                  activeTab === "tokens"
                    ? "bg-[#1E293B] text-white border border-[#374151]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <CurrencyDollarIcon className="w-4 h-4 text-purple-400" />
                Tracked Tokens
              </button>
              <button
                onClick={() => setActiveTab("nfts")}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black tracking-wider transition-all ${
                  activeTab === "nfts"
                    ? "bg-[#1E293B] text-white border border-[#374151]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <PhotoIcon className="w-4 h-4 text-cyan-400" />
                NFT Gallery
              </button>
            </div>

            {/* TAB: TOKENS */}
            {activeTab === "tokens" && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Premium Table Card */}
                <div className="bg-[#0C0F1D]/90 border border-[#1E293B] shadow-[0_20px_40px_rgba(0,0,0,0.6)] rounded-3xl p-6">
                  <h3 className="text-sm uppercase tracking-widest font-black text-white mb-6">Asset Allocation Breakdown</h3>

                  <div className="space-y-3">
                    {allTokens.map((token, index) => {
                      const amt = tokenTotals[token.symbol] || 0;
                      const tokenUSD = amt * (prices[token.symbol] || 0);
                      const colors = ["bg-cyan-400", "bg-purple-500", "bg-emerald-400", "bg-indigo-400", "bg-amber-400"];
                      const indicatorColor = colors[index % colors.length];

                      return (
                        <div 
                          key={token.symbol}
                          className="flex items-center justify-between p-4 bg-[#111827]/40 border border-[#1F2937]/50 hover:border-slate-700/60 rounded-2xl transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${indicatorColor} shadow-[0_0_8px_currentcolor]`}></div>
                            <div>
                              <span className="font-black text-sm text-white block leading-tight">{token.symbol}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{token.label}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-5">
                            <div className="text-right">
                              <span className="font-extrabold text-sm text-white block tracking-tight">
                                {amt.toLocaleString(undefined, { maximumFractionDigits: 5 })}
                              </span>
                              <span className="text-xs text-cyan-400 font-bold block mt-0.5">
                                ${tokenUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>

                            {token.isCustom ? (
                              <button
                                onClick={() => handleRemoveCustomToken(token.symbol)}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove Custom Token"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <a 
                                href={`https://starkscan.co/token/${token.address}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-2 text-slate-500 hover:text-slate-200 hover:bg-[#1E293B] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="View Contract"
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

                {/* Add Custom Token Card */}
                <div className="bg-[#0C0F1D]/90 border border-[#1E293B] shadow-[0_20px_40px_rgba(0,0,0,0.6)] rounded-3xl p-6">
                  <h3 className="text-sm uppercase tracking-widest font-black text-white mb-6 flex items-center gap-2">
                    <PlusIcon className="w-4.5 h-4.5 text-purple-400" />
                    Register Custom Starknet Token
                  </h3>

                  <form onSubmit={handleAddCustomToken} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2">Contract Address</label>
                      <input
                        type="text"
                        placeholder="0x049d365..."
                        value={newTokenAddress}
                        onChange={(e) => setNewTokenAddress(e.target.value)}
                        className="w-full bg-[#111827] border border-[#1F2937] focus:border-purple-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2">Symbol</label>
                      <input
                        type="text"
                        placeholder="LORDS"
                        value={newTokenSymbol}
                        onChange={(e) => setNewTokenSymbol(e.target.value)}
                        className="w-full bg-[#111827] border border-[#1F2937] focus:border-purple-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-grow">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2">Decimals</label>
                        <input
                          type="number"
                          value={newTokenDecimals}
                          onChange={(e) => setNewTokenDecimals(parseInt(e.target.value) || 18)}
                          className="w-full bg-[#111827] border border-[#1F2937] focus:border-purple-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="p-3 bg-[#1F2937] hover:bg-[#374151] rounded-xl text-white active:scale-95 transition-all border border-slate-700/50"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}

            {/* TAB: NFTS */}
            {activeTab === "nfts" && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* NFT Gallery Card */}
                <div className="bg-[#0C0F1D]/90 border border-[#1E293B] shadow-[0_20px_40px_rgba(0,0,0,0.6)] rounded-3xl p-6">
                  <h3 className="text-sm uppercase tracking-widest font-black text-white mb-6">Digital Art Portfolios</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Preloaded NFTs */}
                    {PRELOADED_NFTS.map((nft) => (
                      <div key={nft.id} className="bg-[#111827]/40 border border-[#1F2937]/50 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all flex flex-col justify-between">
                        <div className="h-44 w-full bg-[#070913] relative overflow-hidden">
                          <img src={nft.imageUrl} alt={nft.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                          <span className="absolute top-3 left-3 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-800/40 rounded-full backdrop-blur-md">Collection</span>
                        </div>
                        <div className="p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-0.5">{nft.collection}</span>
                            <h4 className="text-sm font-extrabold text-white leading-tight">{nft.name}</h4>
                          </div>
                          <div className="flex justify-between items-center pt-3 mt-4 border-t border-[#1E293B] text-[10px] font-mono text-slate-400">
                            <span>ID: #{nft.tokenId}</span>
                            <a href={`https://starkscan.co/nft/${nft.contractAddress}/${nft.tokenId}`} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
                              View <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Custom NFTs */}
                    {customNFTs.map((nft) => (
                      <div key={nft.id} className="bg-[#111827]/40 border border-[#1F2937]/50 rounded-2xl overflow-hidden group hover:border-slate-700 transition-all flex flex-col justify-between relative">
                        <div className="h-44 w-full bg-[#070913] relative overflow-hidden flex justify-center items-center">
                          <img src={nft.imageUrl} alt={nft.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                          <span className="absolute top-3 left-3 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 bg-purple-950/80 text-purple-300 border border-purple-800/40 rounded-full backdrop-blur-md font-black">Custom</span>
                          <button
                            onClick={() => handleRemoveCustomNFT(nft.id)}
                            className="absolute top-3 right-3 p-2 bg-red-950/80 text-red-400 border border-red-800/40 rounded-xl hover:bg-red-700 hover:text-white transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-0.5">{nft.collection}</span>
                            <h4 className="text-sm font-extrabold text-white leading-tight">{nft.name}</h4>
                          </div>
                          <div className="flex justify-between items-center pt-3 mt-4 border-t border-[#1E293B] text-[10px] font-mono text-slate-400">
                            <span>ID: #{nft.tokenId}</span>
                            <a href={`https://starkscan.co/nft/${nft.contractAddress}/${nft.tokenId}`} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1">
                              View <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Custom NFT Card */}
                <div className="bg-[#0C0F1D]/90 border border-[#1E293B] shadow-[0_20px_40px_rgba(0,0,0,0.6)] rounded-3xl p-6">
                  <h3 className="text-sm uppercase tracking-widest font-black text-white mb-6 flex items-center gap-2">
                    <PlusIcon className="w-4.5 h-4.5 text-purple-400" />
                    Register Custom Starknet NFT
                  </h3>

                  <form onSubmit={handleAddCustomNFT} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2">Contract Address</label>
                      <input
                        type="text"
                        placeholder="0x05dbcf..."
                        value={newNFTAddress}
                        onChange={(e) => setNewNFTAddress(e.target.value)}
                        className="w-full bg-[#111827] border border-[#1F2937] focus:border-purple-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2">Token ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 452"
                        value={newNFTTokenId}
                        onChange={(e) => setNewNFTTokenId(e.target.value)}
                        className="w-full bg-[#111827] border border-[#1F2937] focus:border-purple-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-grow">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2">Custom NFT Name</label>
                        <input
                          type="text"
                          placeholder="Quest Shield"
                          value={newNFTName}
                          onChange={(e) => setNewNFTName(e.target.value)}
                          className="w-full bg-[#111827] border border-[#1F2937] focus:border-purple-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="p-3 bg-[#1F2937] hover:bg-[#374151] rounded-xl text-white active:scale-95 transition-all border border-slate-700/50"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
