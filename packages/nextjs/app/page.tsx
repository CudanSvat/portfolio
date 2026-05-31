"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount, useProvider } from "@starknet-start/react";
import { 
  PlusIcon, 
  TrashIcon, 
  DocumentDuplicateIcon, 
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  ArrowPathIcon,
  WalletIcon,
  ChartPieIcon,
  CircleStackIcon,
  PhotoIcon,
  CurrencyDollarIcon
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
  
  // Tabs Navigation
  const [activeTab, setActiveTab] = useState<"tokens" | "nfts">("tokens");
  const [useSimulation, setUseSimulation] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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

  // Market Prices (Standard ones fetched/mocked)
  const [prices, setPrices] = useState<Record<string, number>>({
    ETH: 3250.40,
    STRK: 1.28,
    USDC: 1.00,
    LORDS: 0.18,
    DAI: 1.00
  });

  // Calculate list of all tracked addresses (Main connected + added secondary)
  const allAddresses = connectedAddress 
    ? [connectedAddress, ...secondaryAddresses] 
    : secondaryAddresses;

  // Calculate list of all tokens (Preloaded + Custom ones registered)
  const allTokens = [...PRELOADED_TOKENS, ...customTokens];

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
      // Set empty defaults for new connected profiles
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
        // Fallback silently to static prices
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

  // Fetch balances across all tracked wallets and all tokens
  useEffect(() => {
    const fetchAllBalances = async () => {
      setIsLoading(true);
      const newBalances: Record<string, Record<string, number>> = {};

      for (const wallet of allAddresses) {
        newBalances[wallet] = {};
        for (const token of allTokens) {
          if (useSimulation) {
            // Stable simulated assets using hash values
            const walletSeed = wallet.charCodeAt(5) || 12;
            const tokenSeed = token.symbol.charCodeAt(0) || 5;
            const factor = (walletSeed * tokenSeed) % 100;
            
            if (token.symbol === "ETH") {
              newBalances[wallet][token.symbol] = parseFloat(((factor * 0.045) % 3.2).toFixed(4));
            } else if (token.symbol === "STRK") {
              newBalances[wallet][token.symbol] = parseFloat(((factor * 42.5) % 1200).toFixed(2));
            } else if (token.symbol === "USDC") {
              newBalances[wallet][token.symbol] = parseFloat(((factor * 110.2) % 3000).toFixed(2));
            } else {
              newBalances[wallet][token.symbol] = parseFloat(((factor * 25.5) % 400).toFixed(2));
            }
          } else if (provider) {
            // Real RPC Calls
            try {
              const rawBal = await fetchStarknetBalance(provider, token.address, wallet);
              newBalances[wallet][token.symbol] = parseFloat((Number(rawBal) / Math.pow(10, token.decimals)).toFixed(4));
            } catch {
              newBalances[wallet][token.symbol] = 0;
            }
          } else {
            newBalances[wallet][token.symbol] = 0;
          }
        }
      }
      setBalances(newBalances);
      setIsLoading(false);
    };

    if (allAddresses.length > 0) {
      fetchAllBalances();
    }
  }, [secondaryAddresses, customTokens, useSimulation, provider, connectedAddress]);

  const fetchStarknetBalance = async (prov: any, token: string, user: string) => {
    try {
      const res = await prov.callContract({
        contractAddress: token,
        entrypoint: "balance_of",
        calldata: [user]
      });
      if (res && res.result && res.result.length >= 2) {
        const low = BigInt(res.result[0]);
        const high = BigInt(res.result[1]);
        return (high << 128n) + low;
      } else if (res && res.result && res.result.length === 1) {
        return BigInt(res.result[0]);
      }
      return 0n;
    } catch {
      return 0n;
    }
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

    // Standardize to full 64 hex characters (plus 0x prefix = 66 chars)
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
    
    // Add default mock price if not set
    setPrices(prev => ({ ...prev, [symbolCleaned]: 1.50 }));
    
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
      imageUrl: "https://i.imgur.com/WdG91bH.png", // Beautiful standard block placeholder
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
    <div className="flex-grow bg-main text-base-content min-h-screen px-4 py-8 md:px-8 max-w-7xl mx-auto w-full">
      <Toaster position="bottom-right" />
      
      {/* Background Neon Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Connection Screen Wrapper */}
      {!isConnected ? (
        <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
          <div className="p-4 bg-purple-500/10 rounded-full border border-purple-500/30 mb-6 animate-pulse">
            <WalletIcon className="w-16 h-16 text-purple-400" />
          </div>
          <h2 className="text-3xl font-black text-white mb-2">Starknet Portfolio Tracker</h2>
          <p className="text-slate-400 text-sm mb-8">
            Connect your Starknet wallet using the button in the header to instantly open your secure multi-address tracker.
          </p>
          <div className="px-6 py-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-xs text-left text-slate-300">
            💡 **Local Storage Identity Integration**: Your portfolios, custom tokens, and NFT configurations are securely bound directly to whichever main address you log in with.
          </div>
        </div>
      ) : (
        <>
          {/* Dashboard Header Panel */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 relative z-10">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                Starknet Multi-Address Tracker
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-semibold text-slate-400">Anchor Wallet:</span>
                <span className="text-xs font-mono bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                  {connectedAddress ? `${connectedAddress.slice(0, 12)}...${connectedAddress.slice(-8)}` : ""}
                </span>
              </div>
            </div>

            {/* Top Control Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-full border border-slate-700/50">
                <button
                  onClick={() => setUseSimulation(false)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    !useSimulation 
                      ? "bg-gradient-nav text-white shadow-lg" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Real RPC
                </button>
                <button
                  onClick={() => setUseSimulation(true)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                    useSimulation 
                      ? "bg-gradient-nav text-white shadow-lg" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <SparklesIcon className="w-3.5 h-3.5" />
                  Simulation
                </button>
              </div>

              {/* Quick Sync Button */}
              {isLoading && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  Updating
                </div>
              )}
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            
            {/* Left side: Wallets & Add address */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              
              {/* Aggregated Net Worth Card */}
              <div className="bg-component rounded-3xl p-6 border border-slate-700/50 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-600/0 blur-2xl group-hover:scale-125 transition-all duration-500"></div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs uppercase font-bold tracking-wider text-purple-400 flex items-center gap-1.5">
                    <WalletIcon className="w-4 h-4" />
                    Total Net Worth
                  </span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-semibold px-2 py-0.5 rounded">
                    {allAddresses.length} Wallets
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-4xl font-black text-white">
                    ${totalUSDValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400 ml-2 block mt-1">Sum of all tracked tokens</span>
                </div>

                {/* Horizontal progress visualization */}
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex mt-6">
                  <div className="bg-cyan-400" style={{ width: `${totalUSDValue > 0 ? ((tokenTotals.ETH * prices.ETH) / totalUSDValue) * 100 : 0}%` }}></div>
                  <div className="bg-purple-500" style={{ width: `${totalUSDValue > 0 ? ((tokenTotals.STRK * prices.STRK) / totalUSDValue) * 100 : 0}%` }}></div>
                  <div className="bg-green-400" style={{ width: `${totalUSDValue > 0 ? ((tokenTotals.USDC * prices.USDC) / totalUSDValue) * 100 : 0}%` }}></div>
                </div>
              </div>

              {/* Tracked Address Registry ("+" setup) */}
              <div className="bg-component rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
                <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                  <CircleStackIcon className="w-5 h-5 text-cyan-400" />
                  Address Registry
                </h3>

                <div className="space-y-3 mb-6 max-h-[220px] overflow-y-auto pr-1">
                  {/* Connected Main Wallet */}
                  <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-purple-300 block">Main (Connected Anchor)</span>
                      <span className="text-[10px] text-slate-400 font-mono">{connectedAddress ? `${connectedAddress.slice(0, 12)}...${connectedAddress.slice(-8)}` : ""}</span>
                    </div>
                    <span className="text-[9px] bg-purple-500/25 text-purple-300 font-bold px-2 py-0.5 rounded-full">Primary</span>
                  </div>

                  {/* Secondary Wallets */}
                  {secondaryAddresses.map((addr) => (
                    <div key={addr} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/30 flex justify-between items-center group">
                      <div>
                        <span className="text-xs font-bold text-slate-300 block">Secondary Address</span>
                        <span className="text-[10px] text-slate-400 font-mono">{`${addr.slice(0, 12)}...${addr.slice(-8)}`}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveSecondaryAddress(addr)}
                        className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remove Wallet"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Secondary Address Form */}
                <form onSubmit={handleAddSecondaryAddress} className="pt-4 border-t border-slate-700/30">
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Track Another Wallet Address</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="0x04718..."
                      value={newSecAddress}
                      onChange={(e) => setNewSecAddress(e.target.value)}
                      className="bg-slate-800/80 rounded-xl px-3 py-2 text-xs border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 flex-grow"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-gradient-nav rounded-xl text-white hover:opacity-90 transition-opacity flex justify-center items-center shadow-lg"
                      title="Add Wallet"
                    >
                      <PlusIcon className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Right side: Interactive Tabs (Tokens / NFTs / Gas) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Tab Selector Bar */}
              <div className="flex items-center gap-1 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/40">
                <button
                  onClick={() => setActiveTab("tokens")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold tracking-wider transition-all flex-grow md:flex-initial justify-center ${
                    activeTab === "tokens"
                      ? "bg-slate-700 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <CurrencyDollarIcon className="w-4 h-4" />
                  Tokens
                </button>
                <button
                  onClick={() => setActiveTab("nfts")}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold tracking-wider transition-all flex-grow md:flex-initial justify-center ${
                    activeTab === "nfts"
                      ? "bg-slate-700 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <PhotoIcon className="w-4 h-4" />
                  NFTs Showcase
                </button>
              </div>

              {/* TAB CONTENT: TOKENS */}
              {activeTab === "tokens" && (
                <div className="space-y-8">
                  {/* Tokens Balance list */}
                  <div className="bg-component rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Tracked Assets Breakdown</h3>
                    
                    <div className="space-y-4">
                      {allTokens.map((token) => {
                        const amt = tokenTotals[token.symbol] || 0;
                        const tokenUSD = amt * (prices[token.symbol] || 0);

                        return (
                          <div 
                            key={token.symbol}
                            className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all flex justify-between items-center group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                token.symbol === "ETH" ? "bg-cyan-400" :
                                token.symbol === "STRK" ? "bg-purple-500" :
                                token.symbol === "USDC" ? "bg-green-400" : "bg-indigo-400"
                              }`}></div>
                              <div>
                                <span className="font-extrabold text-white text-sm block">{token.symbol}</span>
                                <span className="text-[10px] text-slate-400">{token.label}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm font-bold text-white">{amt.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
                                <div className="text-xs text-slate-400">${tokenUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                              </div>

                              {token.isCustom && (
                                <button
                                  onClick={() => handleRemoveCustomToken(token.symbol)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Delete custom token"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Custom Token Form */}
                  <div className="bg-component rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
                    <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                      <PlusIcon className="w-5 h-5 text-purple-400" />
                      Add Custom Starknet Token
                    </h3>

                    <form onSubmit={handleAddCustomToken} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="text-xs text-slate-400 font-semibold block mb-1">Contract Address</label>
                        <input
                          type="text"
                          placeholder="0x049d365..."
                          value={newTokenAddress}
                          onChange={(e) => setNewTokenAddress(e.target.value)}
                          className="w-full bg-slate-800/80 rounded-xl px-3 py-2 text-xs border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-semibold block mb-1">Symbol</label>
                        <input
                          type="text"
                          placeholder="e.g. LORDS"
                          value={newTokenSymbol}
                          onChange={(e) => setNewTokenSymbol(e.target.value)}
                          className="w-full bg-slate-800/80 rounded-xl px-3 py-2 text-xs border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-grow">
                          <label className="text-xs text-slate-400 font-semibold block mb-1">Decimals</label>
                          <input
                            type="number"
                            value={newTokenDecimals}
                            onChange={(e) => setNewTokenDecimals(parseInt(e.target.value) || 18)}
                            className="w-full bg-slate-800/80 rounded-xl px-3 py-2 text-xs border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <button
                          type="submit"
                          className="p-2.5 bg-gradient-nav rounded-xl text-white hover:opacity-90 transition-opacity flex justify-center items-center shadow-lg"
                          title="Register Token"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: NFTS */}
              {activeTab === "nfts" && (
                <div className="space-y-8">
                  {/* NFT Gallery Grid */}
                  <div className="bg-component rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Portfolio NFT Gallery</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Offered Preloaded NFTs */}
                      {PRELOADED_NFTS.map((nft) => (
                        <div key={nft.id} className="rounded-2xl border border-slate-700/30 overflow-hidden bg-slate-850/40 flex flex-col group relative">
                          <div className="relative h-44 w-full bg-slate-800">
                            <img src={nft.imageUrl} alt={nft.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                            <span className="absolute top-2 left-2 text-[8px] tracking-wider uppercase font-bold px-2 py-0.5 bg-cyan-500 text-white rounded">Offered</span>
                          </div>
                          <div className="p-4 flex-grow flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold">{nft.collection}</span>
                              <h4 className="text-xs font-extrabold text-white mt-1 mb-2">{nft.name}</h4>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-700/20 text-[10px] font-mono text-slate-400">
                              <span>ID: {nft.tokenId}</span>
                              <a href={`https://starkscan.co/nft/${nft.contractAddress}/${nft.tokenId}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                                Explorer <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Custom NFTs */}
                      {customNFTs.map((nft) => (
                        <div key={nft.id} className="rounded-2xl border border-slate-700/30 overflow-hidden bg-slate-850/40 flex flex-col group relative">
                          <div className="relative h-44 w-full bg-slate-800 flex justify-center items-center">
                            <PhotoIcon className="w-12 h-12 text-slate-600 animate-pulse" />
                            <span className="absolute top-2 left-2 text-[8px] tracking-wider uppercase font-bold px-2 py-0.5 bg-purple-500 text-white rounded">Custom</span>
                            <button
                              onClick={() => handleRemoveCustomNFT(nft.id)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white transition-colors"
                              title="Remove Custom NFT"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="p-4 flex-grow flex flex-col justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold">{nft.collection}</span>
                              <h4 className="text-xs font-extrabold text-white mt-1 mb-2">{nft.name}</h4>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-700/20 text-[10px] font-mono text-slate-400">
                              <span>ID: {nft.tokenId}</span>
                              <a href={`https://starkscan.co/nft/${nft.contractAddress}/${nft.tokenId}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                                Explorer <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Custom NFT Form */}
                  <div className="bg-component rounded-3xl p-6 border border-slate-700/50 shadow-2xl">
                    <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
                      <PlusIcon className="w-5 h-5 text-purple-400" />
                      Add Custom Starknet NFT
                    </h3>

                    <form onSubmit={handleAddCustomNFT} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      <div>
                        <label className="text-xs text-slate-400 font-semibold block mb-1">Contract Address</label>
                        <input
                          type="text"
                          placeholder="0x05dbcf..."
                          value={newNFTAddress}
                          onChange={(e) => setNewNFTAddress(e.target.value)}
                          className="w-full bg-slate-800/80 rounded-xl px-3 py-2 text-xs border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 font-semibold block mb-1">Token ID</label>
                        <input
                          type="text"
                          placeholder="e.g. 452"
                          value={newNFTTokenId}
                          onChange={(e) => setNewNFTTokenId(e.target.value)}
                          className="w-full bg-slate-800/80 rounded-xl px-3 py-2 text-xs border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-grow">
                          <label className="text-xs text-slate-400 font-semibold block mb-1">Custom NFT Name</label>
                          <input
                            type="text"
                            placeholder="Quest Shield"
                            value={newNFTName}
                            onChange={(e) => setNewNFTName(e.target.value)}
                            className="w-full bg-slate-800/80 rounded-xl px-3 py-2 text-xs border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <button
                          type="submit"
                          className="p-2.5 bg-gradient-nav rounded-xl text-white hover:opacity-90 transition-opacity flex justify-center items-center shadow-lg"
                          title="Track NFT"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: GAS TRACKER */}


            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Home;
