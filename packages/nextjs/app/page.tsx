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
  CheckIcon,
  PaintBrushIcon
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

type ThemeVariant = "obsidian" | "brutalist" | "cyber" | "swiss";

const Home = () => {
  const { address: connectedAddress } = useAccount();
  const { provider } = useProvider();
  
  // Navigation, UI, and dynamic Theme switcher states
  const [activeTheme, setActiveTheme] = useState<ThemeVariant>("obsidian");
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

  // Market Prices
  const [prices, setPrices] = useState<Record<string, number>>({
    ETH: 3250.40,
    STRK: 1.28,
    USDC: 1.00,
    LORDS: 0.18,
    DAI: 1.00
  });

  const allAddresses = useMemo(() => connectedAddress 
    ? [connectedAddress, ...secondaryAddresses] 
    : secondaryAddresses, [connectedAddress, secondaryAddresses]);

  const allTokens = useMemo(() => [...PRELOADED_TOKENS, ...customTokens], [customTokens]);

  // Save selected theme in localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("selected_portfolio_theme") as ThemeVariant;
    if (savedTheme && ["obsidian", "brutalist", "cyber", "swiss"].includes(savedTheme)) {
      setActiveTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = (theme: ThemeVariant) => {
    setActiveTheme(theme);
    localStorage.setItem("selected_portfolio_theme", theme);
    toast.success(`Switched to ${theme.toUpperCase()} theme!`);
  };

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

    // Fetch live prices
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
      .catch(() => {});
  }, [connectedAddress]);

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success("Address copied!");
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAddSecondaryAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) {
      toast.error("Connect your main wallet first!");
      return;
    }

    const cleaned = newSecAddress.trim().toLowerCase();
    if (!/^0x[0-9a-fA-F]{1,64}$/.test(cleaned)) {
      toast.error("Invalid address format!");
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

  const handleRemoveSecondaryAddress = (addrToRemove: string) => {
    const updatedSec = secondaryAddresses.filter(addr => addr !== addrToRemove);
    setSecondaryAddresses(updatedSec);
    syncToLocalStorage(updatedSec, customTokens, customNFTs);
    toast.success("Wallet link removed");
  };

  const handleAddCustomToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) return;

    const addressCleaned = newTokenAddress.trim().toLowerCase();
    const symbolCleaned = newTokenSymbol.trim().toUpperCase();

    if (!/^0x[0-9a-fA-F]{1,64}$/.test(addressCleaned)) {
      toast.error("Invalid contract address.");
      return;
    }
    if (!symbolCleaned) {
      toast.error("Please enter symbol.");
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
    toast.success(`Custom token ${symbolCleaned} added!`);
  };

  const handleRemoveCustomToken = (symbol: string) => {
    const updatedTokens = customTokens.filter(t => t.symbol !== symbol);
    setCustomTokens(updatedTokens);
    syncToLocalStorage(secondaryAddresses, updatedTokens, customNFTs);
    toast.success("Custom token removed");
  };

  const handleAddCustomNFT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) return;

    const nftAddr = newNFTAddress.trim().toLowerCase();
    const tokId = newNFTTokenId.trim();
    const name = newNFTName.trim() || `Custom NFT #${tokId}`;

    if (!/^0x[0-9a-fA-F]{1,64}$/.test(nftAddr)) {
      toast.error("Invalid contract address.");
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
    toast.success("Custom NFT added!");
  };

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

  // Dynamic Theme Class Configuration Mapping
  const themeClasses = {
    obsidian: {
      wrapper: "bg-[#07080C] text-[#F3F4F6] font-sans selection:bg-[#C5A880]/30 selection:text-white",
      card: "bg-[#0D0F1B] border border-[#1E2235] rounded-none",
      hero: "bg-[#0D0F1B] border-double border-4 border-[#C5A880] p-8",
      accentText: "text-[#C5A880]",
      accentBg: "bg-[#C5A880] hover:bg-[#B3966E] text-black",
      badge: "border border-[#C5A880] text-[#C5A880] bg-transparent",
      input: "bg-[#141724] border border-[#232942] focus:border-[#C5A880] text-white rounded-none",
      button: "border border-[#C5A880]/60 hover:border-[#C5A880] text-[#C5A880] rounded-none",
      navBtnActive: "bg-[#C5A880]/15 text-[#C5A880] border border-[#C5A880]",
      navBtnInactive: "text-slate-400 hover:text-white border border-transparent",
      heading: "font-serif text-white tracking-tight"
    },
    brutalist: {
      wrapper: "bg-[#FFE785] text-[#121212] font-mono p-4 md:p-8",
      card: "bg-white border-4 border-black shadow-[6px_6px_0px_#000] rounded-none p-6",
      hero: "bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-8",
      accentText: "text-[#121212] font-black underline decoration-yellow-400",
      accentBg: "bg-[#00E5FF] hover:bg-[#00B4D8] text-black border-4 border-black shadow-[4px_4px_0px_#000] font-black",
      badge: "bg-black text-white px-3 py-1 font-bold",
      input: "bg-white border-4 border-black focus:bg-yellow-50 text-black placeholder-slate-700 font-bold",
      button: "bg-white hover:bg-slate-100 text-black border-4 border-black shadow-[3px_3px_0px_#000] font-bold",
      navBtnActive: "bg-black text-white border-4 border-black font-black",
      navBtnInactive: "bg-white text-black border-4 border-black hover:bg-slate-100 font-bold",
      heading: "font-mono uppercase tracking-tighter text-black font-black"
    },
    cyber: {
      wrapper: "bg-[#020202] text-[#00FF66] font-mono selection:bg-[#00FF66]/30",
      card: "bg-[#050505] border border-[#00FF66]/30 rounded-none p-5",
      hero: "bg-black border border-[#00FF66] relative p-6 before:absolute before:top-0 before:left-0 before:w-3 before:h-3 before:border-t-2 before:border-l-2 before:border-[#00FF66]",
      accentText: "text-[#00FF66] brightness-125",
      accentBg: "bg-transparent hover:bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.2)]",
      badge: "border border-[#00FF66]/60 text-[#00FF66] uppercase text-[10px]",
      input: "bg-[#080808] border border-[#00FF66]/40 focus:border-[#00FF66] text-[#00FF66] placeholder-[#00FF66]/40 focus:outline-none",
      button: "border border-[#00FF66]/40 hover:bg-[#00FF66]/10 text-[#00FF66] transition-all",
      navBtnActive: "border border-[#00FF66] text-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_8px_rgba(0,255,102,0.15)]",
      navBtnInactive: "border border-[#00FF66]/20 text-[#00FF66]/50 hover:text-[#00FF66] hover:border-[#00FF66]/50",
      heading: "font-mono uppercase tracking-widest text-[#00FF66] brightness-110"
    },
    swiss: {
      wrapper: "bg-[#F9F9FB] text-[#000000] font-sans selection:bg-black selection:text-white p-6",
      card: "bg-white border border-[#E5E7EB] shadow-sm rounded-lg p-6",
      hero: "bg-black text-white p-8 rounded-xl shadow-xl",
      accentText: "text-black font-semibold",
      accentBg: "bg-black hover:bg-neutral-800 text-white rounded-lg font-medium",
      badge: "bg-[#F3F4F6] text-neutral-800 font-medium px-3 py-1 rounded-full",
      input: "bg-[#F9FAFB] border border-[#E5E7EB] focus:border-black rounded-lg text-black focus:outline-none",
      button: "bg-white hover:bg-neutral-50 border border-[#D1D5DB] rounded-lg text-black font-medium",
      navBtnActive: "bg-black text-white rounded-lg shadow-sm font-medium",
      navBtnInactive: "text-neutral-500 hover:text-black font-medium",
      heading: "font-sans font-bold text-black tracking-tight"
    }
  }[activeTheme];

  return (
    <div className={`w-full min-h-screen ${themeClasses.wrapper} transition-colors duration-500 pb-24`}>
      <Toaster position="bottom-right" />

      {/* Modern Sci-Fi Ambient Glow Fields (Only for Obsidian style) */}
      {activeTheme === "obsidian" && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        </>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-8 relative z-10">
        
        {/* Dynamic Design Lab Switcher Bar */}
        <div className={`mb-10 ${themeClasses.card} p-4 flex flex-col md:flex-row justify-between items-center gap-4`}>
          <div className="flex items-center gap-2">
            <PaintBrushIcon className={`w-5 h-5 ${themeClasses.accentText}`} />
            <span className="text-xs uppercase font-extrabold tracking-wider">Design Lab Switcher:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["obsidian", "brutalist", "cyber", "swiss"] as ThemeVariant[]).map((theme) => (
              <button
                key={theme}
                onClick={() => handleThemeChange(theme)}
                className={`px-4 py-2 text-xs font-bold uppercase transition-all duration-300 ${
                  activeTheme === theme
                    ? themeClasses.navBtnActive
                    : "bg-opacity-5 border border-transparent hover:bg-slate-500/10 text-opacity-80"
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Header */}
        <div className={`${themeClasses.hero} mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6`}>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="text-[10px] tracking-widest font-black uppercase">Live Mainnet Multi-Address Dashboard</span>
            </div>
            <h1 className={`text-3xl md:text-5xl font-black ${themeClasses.heading} leading-none`}>
              Starknet Portfolio
            </h1>
            <p className="text-xs mt-2 max-w-xl opacity-75">
              Interact and monitor multiple Starknet addresses at once. Select dynamic styles, monitor assets, and add custom trackers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            {connectedAddress && (
              <div className={`flex items-center justify-between gap-3 p-3 ${activeTheme === 'swiss' ? 'bg-[#F9FAFB] border border-[#E5E7EB]' : 'bg-black/20 border border-white/10'} rounded-lg`}>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-60">Connected Wallet</span>
                  <span className="text-xs font-mono font-bold">
                    {`${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-6)}`}
                  </span>
                </div>
                <button 
                  onClick={() => handleCopy(connectedAddress)}
                  className={`p-1.5 rounded ${activeTheme === 'swiss' ? 'bg-[#E5E7EB]' : 'bg-white/10'} hover:opacity-85`}
                >
                  {copiedText === connectedAddress ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : <DocumentDuplicateIcon className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}

            <button
              onClick={fetchAllBalances}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2.5 px-6 py-3.5 ${themeClasses.accentBg} transition-all disabled:opacity-50`}
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Syncing..." : "Sync Portfolio"}
            </button>
          </div>
        </div>

        {/* Dashboard Grid Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT PANELS: Aggregate and Address Linked lists */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            
            {/* Aggregated Total Net Worth Card */}
            <div className={`${themeClasses.card} p-6`}>
              <div className="flex justify-between items-center mb-6">
                <span className={`text-xs uppercase font-extrabold tracking-widest ${themeClasses.accentText} flex items-center gap-2`}>
                  <WalletIcon className="w-4 h-4" />
                  Aggregate Net Worth
                </span>
                <span className={`text-[10px] ${themeClasses.badge} px-3 py-1 font-bold`}>
                  {allAddresses.length} Linked
                </span>
              </div>

              <div className="mb-6">
                <div className="text-[10px] opacity-75 uppercase tracking-widest font-black mb-1">AGGREGATED VALUE</div>
                <div className={`text-4xl md:text-5xl font-black ${themeClasses.heading} tracking-tight flex items-baseline gap-1`}>
                  <span className="text-2xl font-bold">$</span>
                  {totalUSDValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Progress Visualization per Asset */}
              <div className="space-y-3 pt-2">
                <div className={`h-2.5 w-full ${activeTheme === 'swiss' ? 'bg-neutral-100' : 'bg-neutral-800'} overflow-hidden flex`}>
                  {totalUSDValue > 0 ? allTokens.map((token, index) => {
                    const amt = tokenTotals[token.symbol] || 0;
                    const val = amt * (prices[token.symbol] || 0);
                    const pct = (val / totalUSDValue) * 100;
                    if (pct === 0) return null;
                    
                    const colors = ["bg-amber-400", "bg-purple-500", "bg-emerald-400", "bg-indigo-400", "bg-cyan-400"];
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
                    
                    const colors = ["bg-amber-400", "bg-purple-500", "bg-emerald-400", "bg-indigo-400", "bg-cyan-400"];
                    const dotColor = colors[index % colors.length];

                    return (
                      <div key={token.symbol} className="flex items-center gap-1.5 text-[10px] font-bold">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                        <span>{token.symbol} ({pct.toFixed(0)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Address Registry Box */}
            <div className={`${themeClasses.card} p-6`}>
              <h3 className={`text-sm uppercase tracking-widest font-black mb-6 flex items-center gap-2 ${themeClasses.accentText}`}>
                <CircleStackIcon className="w-5 h-5" />
                Linked Wallets
              </h3>

              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 mb-6">
                {/* Connected Wallet Row */}
                <div className={`p-4 ${activeTheme === 'swiss' ? 'bg-[#FAFBFD] border border-[#E5E7EB]' : 'bg-white/5 border border-white/10'} rounded-lg flex justify-between items-center group`}>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 block mb-0.5">Primary Connection</span>
                    <span className="text-xs font-mono font-bold">
                      {connectedAddress ? `${connectedAddress.slice(0, 14)}...${connectedAddress.slice(-8)}` : ""}
                    </span>
                  </div>
                  <span className={`text-[8px] ${themeClasses.badge} px-2 py-0.5 rounded font-black tracking-wider uppercase`}>Active</span>
                </div>

                {/* Secondary Wallets */}
                {secondaryAddresses.map((addr) => (
                  <div key={addr} className={`p-4 ${activeTheme === 'swiss' ? 'bg-white border border-[#E5E7EB]' : 'bg-white/5 border border-white/5'} hover:border-slate-500 rounded-lg flex justify-between items-center group transition-colors`}>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-50 block mb-0.5">Secondary Tracked</span>
                      <span className="text-xs font-mono font-bold">
                        {`${addr.slice(0, 14)}...${addr.slice(-8)}`}
                      </span>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleCopy(addr)}
                        className="p-1 hover:text-white"
                        title="Copy"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRemoveSecondaryAddress(addr)}
                        className="p-1 hover:text-red-400"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Secondary form */}
              <form onSubmit={handleAddSecondaryAddress} className="pt-5 border-t border-slate-700/20">
                <label className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 block mb-2">Link Another Starknet Wallet</label>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="0x04718..."
                    value={newSecAddress}
                    onChange={(e) => setNewSecAddress(e.target.value)}
                    className={`px-3 py-2 text-xs flex-grow ${themeClasses.input}`}
                  />
                  <button
                    type="submit"
                    className={`px-3.5 py-2.5 ${themeClasses.button} flex justify-center items-center`}
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* RIGHT PANELS: Dynamic Token Breakdown or NFTs Showcase */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* dynamic Tab Selector Bar */}
            <div className={`flex items-center gap-2 ${themeClasses.card} p-1.5 w-fit shadow-2xl`}>
              <button
                onClick={() => setActiveTab("tokens")}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black tracking-wider transition-all ${
                  activeTab === "tokens"
                    ? themeClasses.navBtnActive
                    : themeClasses.navBtnInactive
                }`}
              >
                <CurrencyDollarIcon className="w-4 h-4" />
                Tracked Tokens
              </button>
              <button
                onClick={() => setActiveTab("nfts")}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-black tracking-wider transition-all ${
                  activeTab === "nfts"
                    ? themeClasses.navBtnActive
                    : themeClasses.navBtnInactive
                }`}
              >
                <PhotoIcon className="w-4 h-4" />
                NFT Gallery
              </button>
            </div>

            {/* TAB: TOKENS */}
            {activeTab === "tokens" && (
              <div className="space-y-8 animate-fadeIn">
                
                {/* Premium Table Card */}
                <div className={`${themeClasses.card} p-6`}>
                  <h3 className={`text-sm uppercase tracking-widest font-black mb-6 ${themeClasses.accentText}`}>Asset Allocation Breakdown</h3>

                  <div className="space-y-3">
                    {allTokens.map((token, index) => {
                      const amt = tokenTotals[token.symbol] || 0;
                      const tokenUSD = amt * (prices[token.symbol] || 0);
                      const colors = ["bg-amber-400", "bg-purple-500", "bg-emerald-400", "bg-indigo-400", "bg-cyan-400"];
                      const indicatorColor = colors[index % colors.length];

                      return (
                        <div 
                          key={token.symbol}
                          className={`flex items-center justify-between p-4 ${activeTheme === 'swiss' ? 'bg-[#F9FAFB] border border-[#E5E7EB]' : 'bg-white/5 border border-white/5'} hover:border-slate-500 rounded-lg transition-all group`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full ${indicatorColor}`}></div>
                            <div>
                              <span className="font-black text-sm block leading-tight">{token.symbol}</span>
                              <span className="text-[10px] opacity-60 font-bold uppercase tracking-wider">{token.label}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-5">
                            <div className="text-right">
                              <span className="font-extrabold text-sm block tracking-tight">
                                {amt.toLocaleString(undefined, { maximumFractionDigits: 5 })}
                              </span>
                              <span className="text-xs font-bold block mt-0.5 opacity-80">
                                ${tokenUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>

                            {token.isCustom ? (
                              <button
                                onClick={() => handleRemoveCustomToken(token.symbol)}
                                className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove Custom Token"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <a 
                                href={`https://starkscan.co/token/${token.address}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-2 text-slate-500 hover:text-slate-200 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
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
                <div className={`${themeClasses.card} p-6`}>
                  <h3 className={`text-sm uppercase tracking-widest font-black mb-6 flex items-center gap-2 ${themeClasses.accentText}`}>
                    <PlusIcon className="w-4.5 h-4.5" />
                    Register Custom Starknet Token
                  </h3>

                  <form onSubmit={handleAddCustomToken} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                      <label className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 block mb-2">Contract Address</label>
                      <input
                        type="text"
                        placeholder="0x049d365..."
                        value={newTokenAddress}
                        onChange={(e) => setNewTokenAddress(e.target.value)}
                        className={`w-full px-3 py-2 text-xs ${themeClasses.input}`}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 block mb-2">Symbol</label>
                      <input
                        type="text"
                        placeholder="LORDS"
                        value={newTokenSymbol}
                        onChange={(e) => setNewTokenSymbol(e.target.value)}
                        className={`w-full px-3 py-2 text-xs ${themeClasses.input}`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-grow">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 block mb-2">Decimals</label>
                        <input
                          type="number"
                          value={newTokenDecimals}
                          onChange={(e) => setNewTokenDecimals(parseInt(e.target.value) || 18)}
                          className={`w-full px-3 py-2 text-xs ${themeClasses.input}`}
                        />
                      </div>
                      <button
                        type="submit"
                        className={`px-3 py-2.5 ${themeClasses.button} transition-all`}
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
                <div className={`${themeClasses.card} p-6`}>
                  <h3 className={`text-sm uppercase tracking-widest font-black mb-6 ${themeClasses.accentText}`}>Digital Art Portfolios</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Preloaded NFTs */}
                    {PRELOADED_NFTS.map((nft) => (
                      <div key={nft.id} className={`overflow-hidden transition-all duration-300 flex flex-col justify-between ${
                        activeTheme === 'swiss' 
                          ? 'border border-[#E5E7EB] hover:shadow-md rounded-xl bg-white' 
                          : 'border border-white/10 bg-white/5 hover:border-slate-500'
                      }`}>
                        <div className="h-44 w-full bg-black/20 relative overflow-hidden">
                          <img src={nft.imageUrl} alt={nft.name} className="object-cover w-full h-full" />
                          <span className={`absolute top-3 left-3 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 ${themeClasses.badge} rounded-full`}>Collection</span>
                        </div>
                        <div className="p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <span className={`text-[10px] font-bold ${themeClasses.accentText} uppercase tracking-widest block mb-0.5`}>{nft.collection}</span>
                            <h4 className="text-sm font-extrabold leading-tight">{nft.name}</h4>
                          </div>
                          <div className="flex justify-between items-center pt-3 mt-4 border-t border-slate-700/10 text-[10px] font-mono opacity-60">
                            <span>ID: #{nft.tokenId}</span>
                            <a href={`https://starkscan.co/nft/${nft.contractAddress}/${nft.tokenId}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                              View <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Custom NFTs */}
                    {customNFTs.map((nft) => (
                      <div key={nft.id} className={`overflow-hidden transition-all duration-300 flex flex-col justify-between relative ${
                        activeTheme === 'swiss' 
                          ? 'border border-[#E5E7EB] hover:shadow-md rounded-xl bg-white' 
                          : 'border border-white/10 bg-white/5 hover:border-slate-500'
                      }`}>
                        <div className="h-44 w-full bg-black/20 relative overflow-hidden flex justify-center items-center">
                          <img src={nft.imageUrl} alt={nft.name} className="object-cover w-full h-full" />
                          <span className={`absolute top-3 left-3 text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-1 ${themeClasses.badge} rounded-full`}>Custom</span>
                          <button
                            onClick={() => handleRemoveCustomNFT(nft.id)}
                            className="absolute top-3 right-3 p-2 bg-red-950/80 text-red-400 border border-red-800/40 rounded-xl hover:bg-red-700 hover:text-white transition-colors z-10"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <span className={`text-[10px] font-bold ${themeClasses.accentText} uppercase tracking-widest block mb-0.5`}>{nft.collection}</span>
                            <h4 className="text-sm font-extrabold leading-tight">{nft.name}</h4>
                          </div>
                          <div className="flex justify-between items-center pt-3 mt-4 border-t border-slate-700/10 text-[10px] font-mono opacity-60">
                            <span>ID: #{nft.tokenId}</span>
                            <a href={`https://starkscan.co/nft/${nft.contractAddress}/${nft.tokenId}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                              View <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Custom NFT Card */}
                <div className={`${themeClasses.card} p-6`}>
                  <h3 className={`text-sm uppercase tracking-widest font-black mb-6 flex items-center gap-2 ${themeClasses.accentText}`}>
                    <PlusIcon className="w-4.5 h-4.5" />
                    Register Custom Starknet NFT
                  </h3>

                  <form onSubmit={handleAddCustomNFT} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 block mb-2">Contract Address</label>
                      <input
                        type="text"
                        placeholder="0x05dbcf..."
                        value={newNFTAddress}
                        onChange={(e) => setNewNFTAddress(e.target.value)}
                        className={`w-full px-3 py-2 text-xs ${themeClasses.input}`}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 block mb-2">Token ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 452"
                        value={newNFTTokenId}
                        onChange={(e) => setNewNFTTokenId(e.target.value)}
                        className={`w-full px-3 py-2 text-xs ${themeClasses.input}`}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-grow">
                        <label className="text-[9px] uppercase tracking-wider font-extrabold opacity-60 block mb-2">Custom NFT Name</label>
                        <input
                          type="text"
                          placeholder="Quest Shield"
                          value={newNFTName}
                          onChange={(e) => setNewNFTName(e.target.value)}
                          className={`w-full px-3 py-2 text-xs ${themeClasses.input}`}
                        />
                      </div>
                      <button
                        type="submit"
                        className={`px-3 py-2.5 ${themeClasses.button} transition-all`}
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
