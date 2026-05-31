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
  SparklesIcon,
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";

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
  { address: "0x0da114eb680457337696c34812f21a981c9a6cc94187f4c202c49924d5d5ecb", symbol: "DAI", decimals: 18, label: "Dai Stablecoin" },
];

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
  { id: "p3", name: "Starknet.id Domain", collection: "Starknet ID", imageUrl: "https://i.imgur.com/GjT8S0I.png", contractAddress: "0x05dbcf33f2bb2e4cfafab92d021c64264d90071c261e4737d2a55a79ee6fc49e", tokenId: "998212" },
  { id: "p4", name: "Briq Castle Block", collection: "Briq", imageUrl: "https://i.imgur.com/WdG91bH.png", contractAddress: "0x014c878787878787878787878787878787878787878787878787878787878787", tokenId: "1098" },
];

type ThemeVariant =
  | "obsidian"
  | "brutalist"
  | "cyber"
  | "swiss"
  | "aurora"
  | "noir"
  | "ocean"
  | "copper"
  | "sakura"
  | "miami"
  | "paper"
  | "military";

interface ThemeConfig {
  label: string;
  emoji: string;
  wrapper: string;
  card: string;
  hero: string;
  accentText: string;
  accentBg: string;
  badge: string;
  input: string;
  button: string;
  navBtnActive: string;
  navBtnInactive: string;
  heading: string;
  subtext: string;
  divider: string;
  rowHover: string;
}

const THEMES: Record<ThemeVariant, ThemeConfig> = {
  obsidian: {
    label: "Obsidian",
    emoji: "🖤",
    wrapper: "bg-[#07080C] text-[#E8E9ED]",
    card: "bg-[#0D0F1B] border border-[#1E2235] p-6",
    hero: "bg-[#0D0F1B] border-double border-4 border-[#C5A880] p-8",
    accentText: "text-[#C5A880]",
    accentBg: "bg-[#C5A880] hover:bg-[#B3966E] text-[#07080C] font-bold px-6 py-3",
    badge: "border border-[#C5A880]/50 text-[#C5A880] bg-[#C5A880]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider",
    input: "bg-[#141724] border border-[#232942] focus:border-[#C5A880]/60 text-white placeholder-slate-600 px-3 py-2.5 text-xs focus:outline-none",
    button: "border border-[#C5A880]/40 hover:border-[#C5A880] text-[#C5A880] hover:bg-[#C5A880]/10 px-3 py-2.5 transition-all",
    navBtnActive: "bg-[#C5A880]/10 text-[#C5A880] border border-[#C5A880] px-5 py-2.5",
    navBtnInactive: "text-slate-400 hover:text-[#C5A880] border border-transparent px-5 py-2.5",
    heading: "font-serif",
    subtext: "text-slate-400",
    divider: "border-[#1E2235]",
    rowHover: "hover:bg-[#C5A880]/5 hover:border-[#C5A880]/30 border border-[#1E2235]",
  },
  brutalist: {
    label: "Brutalist",
    emoji: "⬛",
    wrapper: "bg-[#F5F0E8] text-[#111111]",
    card: "bg-white border-[3px] border-black shadow-[5px_5px_0px_#000] p-6",
    hero: "bg-[#111111] text-white border-[3px] border-black shadow-[8px_8px_0px_#F5C400] p-8",
    accentText: "text-[#111111] font-black",
    accentBg: "bg-[#F5C400] hover:bg-[#E0B300] text-black font-black border-[3px] border-black shadow-[3px_3px_0px_#000] px-6 py-3 uppercase tracking-wide",
    badge: "bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-wider border-[2px] border-black",
    input: "bg-white border-[3px] border-black focus:bg-[#FFFDE7] text-black placeholder-gray-500 px-3 py-2.5 text-xs font-bold focus:outline-none",
    button: "bg-white hover:bg-[#F5C400] border-[3px] border-black shadow-[2px_2px_0px_#000] text-black font-black px-3 py-2.5 uppercase tracking-wide",
    navBtnActive: "bg-black text-white border-[3px] border-black px-5 py-2.5 font-black uppercase tracking-wide",
    navBtnInactive: "bg-white border-[3px] border-black text-black font-black px-5 py-2.5 hover:bg-[#F5C400] uppercase tracking-wide",
    heading: "font-black uppercase tracking-tighter",
    subtext: "text-gray-600 font-bold",
    divider: "border-black border-[2px]",
    rowHover: "hover:bg-[#F5C400]/20 border-[2px] border-black",
  },
  cyber: {
    label: "Cyber",
    emoji: "💚",
    wrapper: "bg-[#010101] text-[#00FF66] font-mono",
    card: "bg-[#030505] border border-[#00FF66]/25 p-6",
    hero: "bg-[#010101] border border-[#00FF66] p-8",
    accentText: "text-[#00FF66]",
    accentBg: "bg-transparent hover:bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.2)] px-6 py-3 font-bold tracking-wider",
    badge: "border border-[#00FF66]/50 text-[#00FF66] bg-[#00FF66]/5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
    input: "bg-[#050505] border border-[#00FF66]/30 focus:border-[#00FF66] text-[#00FF66] placeholder-[#00FF66]/30 px-3 py-2.5 text-xs focus:outline-none",
    button: "border border-[#00FF66]/40 hover:bg-[#00FF66]/10 hover:border-[#00FF66] text-[#00FF66] px-3 py-2.5 transition-all",
    navBtnActive: "border border-[#00FF66] text-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_10px_rgba(0,255,102,0.15)] px-5 py-2.5",
    navBtnInactive: "border border-[#00FF66]/20 text-[#00FF66]/40 hover:text-[#00FF66] hover:border-[#00FF66]/60 px-5 py-2.5",
    heading: "font-mono uppercase tracking-widest",
    subtext: "text-[#00FF66]/50",
    divider: "border-[#00FF66]/20",
    rowHover: "hover:bg-[#00FF66]/5 hover:border-[#00FF66]/40 border border-[#00FF66]/15",
  },
  swiss: {
    label: "Swiss",
    emoji: "🤍",
    wrapper: "bg-[#F7F7F7] text-[#111111]",
    card: "bg-white border border-[#E0E0E0] shadow-sm p-6",
    hero: "bg-[#111111] text-white p-8 shadow-2xl",
    accentText: "text-[#111111] font-semibold",
    accentBg: "bg-[#111111] hover:bg-[#333333] text-white font-semibold rounded-lg px-6 py-3",
    badge: "bg-[#EEEEEE] text-[#555555] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full",
    input: "bg-[#F7F7F7] border border-[#D5D5D5] focus:border-[#111111] text-black placeholder-[#AAAAAA] rounded-lg px-3 py-2.5 text-xs focus:outline-none",
    button: "bg-white hover:bg-[#F0F0F0] border border-[#D5D5D5] text-black font-medium rounded-lg px-3 py-2.5",
    navBtnActive: "bg-[#111111] text-white rounded-lg px-5 py-2.5 font-semibold",
    navBtnInactive: "text-[#888888] hover:text-[#111111] px-5 py-2.5 font-medium",
    heading: "font-bold tracking-tight",
    subtext: "text-[#888888]",
    divider: "border-[#E5E5E5]",
    rowHover: "hover:bg-[#F5F5F5] hover:border-[#CCCCCC] border border-[#E5E5E5] rounded-lg",
  },
  aurora: {
    label: "Aurora",
    emoji: "🌌",
    wrapper: "bg-[#05091A] text-[#E2E8F7]",
    card: "bg-gradient-to-br from-[#0D1030] to-[#0A1528] border border-[#2A3060] p-6",
    hero: "bg-gradient-to-r from-[#1A0A3C] via-[#0D1E40] to-[#0A2828] border border-[#4A3080]/50 p-8",
    accentText: "text-[#A78BFA]",
    accentBg: "bg-gradient-to-r from-[#7C3AED] to-[#0EA5E9] hover:from-[#6D28D9] hover:to-[#0284C7] text-white px-6 py-3 font-semibold shadow-lg",
    badge: "bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#A78BFA] px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
    input: "bg-[#0A0E25] border border-[#2A3060] focus:border-[#7C3AED]/60 text-white placeholder-slate-600 px-3 py-2.5 text-xs focus:outline-none rounded-lg",
    button: "border border-[#7C3AED]/40 hover:border-[#7C3AED] text-[#A78BFA] hover:bg-[#7C3AED]/15 px-3 py-2.5 rounded-lg transition-all",
    navBtnActive: "bg-gradient-to-r from-[#7C3AED]/30 to-[#0EA5E9]/20 border border-[#7C3AED]/60 text-[#A78BFA] px-5 py-2.5 rounded-lg",
    navBtnInactive: "text-slate-500 hover:text-[#A78BFA] border border-transparent px-5 py-2.5",
    heading: "font-bold tracking-tight bg-gradient-to-r from-[#A78BFA] to-[#38BDF8] bg-clip-text text-transparent",
    subtext: "text-slate-500",
    divider: "border-[#2A3060]",
    rowHover: "hover:bg-[#7C3AED]/10 hover:border-[#7C3AED]/40 border border-[#2A3060] rounded-lg",
  },
  noir: {
    label: "Noir",
    emoji: "🎬",
    wrapper: "bg-[#111010] text-[#D4C9A8]",
    card: "bg-[#1A1815] border border-[#2E2B25] p-6",
    hero: "bg-[#1A1815] border-l-4 border-[#D4A853] p-8",
    accentText: "text-[#D4A853]",
    accentBg: "bg-[#D4A853] hover:bg-[#C49A42] text-[#111010] font-bold px-6 py-3 tracking-wide",
    badge: "border-l-2 border-[#D4A853] text-[#D4A853] bg-[#D4A853]/10 pl-2 pr-3 py-1 text-[10px] font-bold uppercase tracking-wider",
    input: "bg-[#111010] border border-[#2E2B25] focus:border-[#D4A853]/50 text-[#D4C9A8] placeholder-[#6B6456] px-3 py-2.5 text-xs focus:outline-none",
    button: "border border-[#2E2B25] hover:border-[#D4A853]/50 text-[#D4C9A8] hover:text-[#D4A853] px-3 py-2.5 transition-all",
    navBtnActive: "border-b-2 border-[#D4A853] text-[#D4A853] bg-transparent px-5 py-2.5",
    navBtnInactive: "text-[#6B6456] hover:text-[#D4C9A8] border-b-2 border-transparent px-5 py-2.5",
    heading: "font-serif italic tracking-wide",
    subtext: "text-[#6B6456]",
    divider: "border-[#2E2B25]",
    rowHover: "hover:bg-[#D4A853]/5 hover:border-l-2 hover:border-l-[#D4A853] border border-[#2E2B25]",
  },
  ocean: {
    label: "Ocean",
    emoji: "🌊",
    wrapper: "bg-[#020E1A] text-[#B8D8E8]",
    card: "bg-[#061828] border border-[#0E3A5A] p-6",
    hero: "bg-gradient-to-r from-[#061828] to-[#051522] border border-[#0A5070]/60 p-8",
    accentText: "text-[#22D3EE]",
    accentBg: "bg-[#0891B2] hover:bg-[#0E7490] text-white px-6 py-3 font-semibold shadow-[0_0_20px_rgba(8,145,178,0.3)]",
    badge: "bg-[#0891B2]/20 border border-[#0891B2]/40 text-[#22D3EE] px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
    input: "bg-[#020E1A] border border-[#0E3A5A] focus:border-[#0891B2]/70 text-[#B8D8E8] placeholder-[#1E4A6A] px-3 py-2.5 text-xs focus:outline-none rounded-lg",
    button: "border border-[#0E3A5A] hover:border-[#0891B2]/60 text-[#22D3EE] hover:bg-[#0891B2]/10 px-3 py-2.5 rounded-lg transition-all",
    navBtnActive: "bg-[#0891B2]/20 border border-[#0891B2]/60 text-[#22D3EE] px-5 py-2.5 rounded-lg shadow-[0_0_10px_rgba(8,145,178,0.15)]",
    navBtnInactive: "text-[#1E4A6A] hover:text-[#22D3EE] border border-transparent px-5 py-2.5",
    heading: "font-bold tracking-tight text-[#7DD3F5]",
    subtext: "text-[#1E4A6A]",
    divider: "border-[#0E3A5A]",
    rowHover: "hover:bg-[#0891B2]/10 hover:border-[#0891B2]/40 border border-[#0E3A5A] rounded-lg",
  },
  copper: {
    label: "Copper",
    emoji: "🔶",
    wrapper: "bg-[#0C0906] text-[#E8D5C0]",
    card: "bg-[#17110A] border border-[#3A2518] p-6",
    hero: "bg-gradient-to-br from-[#1E1208] to-[#17110A] border border-[#B87333]/40 p-8",
    accentText: "text-[#B87333]",
    accentBg: "bg-gradient-to-r from-[#B87333] to-[#CD853F] hover:from-[#A0622A] hover:to-[#B8763A] text-white px-6 py-3 font-bold shadow-lg",
    badge: "border border-[#B87333]/50 text-[#B87333] bg-[#B87333]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm",
    input: "bg-[#0C0906] border border-[#3A2518] focus:border-[#B87333]/50 text-[#E8D5C0] placeholder-[#5A3A28] px-3 py-2.5 text-xs focus:outline-none",
    button: "border border-[#3A2518] hover:border-[#B87333]/50 text-[#B87333] hover:bg-[#B87333]/10 px-3 py-2.5 transition-all",
    navBtnActive: "bg-[#B87333]/15 border border-[#B87333]/60 text-[#B87333] px-5 py-2.5",
    navBtnInactive: "text-[#5A3A28] hover:text-[#B87333] border border-transparent px-5 py-2.5",
    heading: "font-bold tracking-tight",
    subtext: "text-[#5A3A28]",
    divider: "border-[#3A2518]",
    rowHover: "hover:bg-[#B87333]/8 hover:border-[#B87333]/30 border border-[#3A2518]",
  },
  sakura: {
    label: "Sakura",
    emoji: "🌸",
    wrapper: "bg-[#FEF6F8] text-[#2D1B25]",
    card: "bg-white border border-[#F0D0DC] shadow-sm p-6",
    hero: "bg-gradient-to-r from-[#FCE4EC] to-[#F8E4F0] border border-[#E8A0B8] p-8",
    accentText: "text-[#C0567A]",
    accentBg: "bg-[#C0567A] hover:bg-[#A8496A] text-white px-6 py-3 font-semibold rounded-full shadow-md",
    badge: "bg-[#FCE4EC] border border-[#E8A0B8] text-[#C0567A] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full",
    input: "bg-[#FEF6F8] border border-[#F0D0DC] focus:border-[#C0567A]/60 text-[#2D1B25] placeholder-[#D4A0B8] rounded-full px-4 py-2.5 text-xs focus:outline-none",
    button: "border border-[#F0D0DC] hover:border-[#C0567A]/50 text-[#C0567A] hover:bg-[#FCE4EC] px-3 py-2.5 rounded-full transition-all",
    navBtnActive: "bg-[#C0567A] text-white rounded-full px-5 py-2.5 shadow-sm font-semibold",
    navBtnInactive: "text-[#C0A0B0] hover:text-[#C0567A] px-5 py-2.5 font-medium",
    heading: "font-bold tracking-tight text-[#2D1B25]",
    subtext: "text-[#C0A0B0]",
    divider: "border-[#F0D0DC]",
    rowHover: "hover:bg-[#FCE4EC] hover:border-[#E8A0B8] border border-[#F0D0DC] rounded-xl",
  },
  miami: {
    label: "Miami",
    emoji: "🌴",
    wrapper: "bg-[#08021A] text-[#F0E6FF]",
    card: "bg-[#100828] border border-[#4A1080]/50 p-6",
    hero: "bg-gradient-to-r from-[#1A0428] via-[#100828] to-[#04122A] border border-transparent p-8 relative",
    accentText: "text-[#FF2D78]",
    accentBg: "bg-gradient-to-r from-[#FF2D78] to-[#FF6B35] hover:from-[#E02468] hover:to-[#E05A25] text-white px-6 py-3 font-bold tracking-wide shadow-[0_0_25px_rgba(255,45,120,0.4)]",
    badge: "border border-[#FF2D78]/50 text-[#FF2D78] bg-[#FF2D78]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
    input: "bg-[#08021A] border border-[#4A1080]/50 focus:border-[#FF2D78]/60 text-[#F0E6FF] placeholder-[#5A3A7A] px-3 py-2.5 text-xs focus:outline-none rounded-lg",
    button: "border border-[#4A1080]/50 hover:border-[#FF2D78]/50 text-[#FF2D78] hover:bg-[#FF2D78]/10 px-3 py-2.5 rounded-lg transition-all",
    navBtnActive: "bg-gradient-to-r from-[#FF2D78]/20 to-[#FF6B35]/10 border border-[#FF2D78]/60 text-[#FF2D78] px-5 py-2.5 rounded-lg",
    navBtnInactive: "text-[#5A3A7A] hover:text-[#FF2D78] border border-transparent px-5 py-2.5",
    heading: "font-bold tracking-tight bg-gradient-to-r from-[#FF2D78] via-[#B845F5] to-[#22D3EE] bg-clip-text text-transparent",
    subtext: "text-[#5A3A7A]",
    divider: "border-[#4A1080]/40",
    rowHover: "hover:bg-[#FF2D78]/8 hover:border-[#FF2D78]/40 border border-[#4A1080]/30 rounded-lg",
  },
  paper: {
    label: "Paper",
    emoji: "📄",
    wrapper: "bg-[#F5F0E8] text-[#2C2416]",
    card: "bg-[#FDFAF5] border border-[#D8CEBC] shadow-sm p-6",
    hero: "bg-[#F0EAD6] border border-[#C8BEAC] p-8",
    accentText: "text-[#5C4A32]",
    accentBg: "bg-[#2C2416] hover:bg-[#3E3020] text-[#F5F0E8] px-6 py-3 font-semibold tracking-wide",
    badge: "border border-[#C8BEAC] text-[#5C4A32] bg-[#E8E0CC] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider",
    input: "bg-[#FDFAF5] border border-[#D8CEBC] focus:border-[#5C4A32]/50 text-[#2C2416] placeholder-[#B8A898] px-3 py-2.5 text-xs focus:outline-none",
    button: "border border-[#C8BEAC] hover:border-[#5C4A32]/50 text-[#5C4A32] hover:bg-[#E8E0CC] px-3 py-2.5 transition-all",
    navBtnActive: "bg-[#2C2416] text-[#F5F0E8] px-5 py-2.5 font-semibold",
    navBtnInactive: "text-[#A89880] hover:text-[#2C2416] border border-transparent px-5 py-2.5 font-medium",
    heading: "font-serif italic tracking-wide text-[#2C2416]",
    subtext: "text-[#A89880]",
    divider: "border-[#D8CEBC]",
    rowHover: "hover:bg-[#E8E0CC] hover:border-[#C8BEAC] border border-[#D8CEBC]",
  },
  military: {
    label: "Military",
    emoji: "🪖",
    wrapper: "bg-[#0E120B] text-[#C5C9A4]",
    card: "bg-[#151A10] border border-[#2E3A20] p-6",
    hero: "bg-[#151A10] border-l-4 border-[#6B8C42] p-8",
    accentText: "text-[#8BB454]",
    accentBg: "bg-[#4A6B28] hover:bg-[#3D5A20] text-[#C5C9A4] px-6 py-3 font-bold tracking-widest uppercase",
    badge: "border border-[#6B8C42]/50 text-[#8BB454] bg-[#6B8C42]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
    input: "bg-[#0E120B] border border-[#2E3A20] focus:border-[#6B8C42]/60 text-[#C5C9A4] placeholder-[#3A4A28] px-3 py-2.5 text-xs focus:outline-none",
    button: "border border-[#2E3A20] hover:border-[#6B8C42]/60 text-[#8BB454] hover:bg-[#6B8C42]/10 px-3 py-2.5 transition-all uppercase tracking-wider text-[10px] font-bold",
    navBtnActive: "bg-[#4A6B28] border border-[#6B8C42] text-[#C5C9A4] px-5 py-2.5 font-bold uppercase tracking-wider",
    navBtnInactive: "text-[#3A4A28] hover:text-[#8BB454] border border-[#2E3A20] px-5 py-2.5 uppercase tracking-wider text-[10px] font-bold",
    heading: "font-bold tracking-widest uppercase text-[#8BB454]",
    subtext: "text-[#3A4A28]",
    divider: "border-[#2E3A20]",
    rowHover: "hover:bg-[#6B8C42]/8 hover:border-[#6B8C42]/40 border border-[#2E3A20]",
  },
};

const ALL_THEMES = Object.keys(THEMES) as ThemeVariant[];

const Home = () => {
  const { address: connectedAddress } = useAccount();
  const { provider } = useProvider();

  const [activeTheme, setActiveTheme] = useState<ThemeVariant>("obsidian");
  const [activeTab, setActiveTab] = useState<"tokens" | "nfts">("tokens");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const [secondaryAddresses, setSecondaryAddresses] = useState<string[]>([]);
  const [customTokens, setCustomTokens] = useState<TokenInfo[]>([]);
  const [customNFTs, setCustomNFTs] = useState<NFTInfo[]>([]);

  const [newSecAddress, setNewSecAddress] = useState("");
  const [newTokenAddress, setNewTokenAddress] = useState("");
  const [newTokenSymbol, setNewTokenSymbol] = useState("");
  const [newTokenDecimals, setNewTokenDecimals] = useState(18);
  const [newNFTAddress, setNewNFTAddress] = useState("");
  const [newNFTTokenId, setNewNFTTokenId] = useState("");
  const [newNFTName, setNewNFTName] = useState("");

  const [balances, setBalances] = useState<Record<string, Record<string, number>>>({});
  const [prices, setPrices] = useState<Record<string, number>>({
    ETH: 3250.40, STRK: 1.28, USDC: 1.00, LORDS: 0.18, DAI: 1.00,
  });

  const allAddresses = useMemo(
    () => (connectedAddress ? [connectedAddress, ...secondaryAddresses] : secondaryAddresses),
    [connectedAddress, secondaryAddresses],
  );
  const allTokens = useMemo(() => [...PRELOADED_TOKENS, ...customTokens], [customTokens]);

  useEffect(() => {
    const saved = localStorage.getItem("portfolio_theme") as ThemeVariant;
    if (saved && ALL_THEMES.includes(saved)) setActiveTheme(saved);
  }, []);

  const handleThemeChange = (theme: ThemeVariant) => {
    setActiveTheme(theme);
    localStorage.setItem("portfolio_theme", theme);
    setShowThemePicker(false);
    toast.success(`${THEMES[theme].emoji} ${THEMES[theme].label} theme applied`);
  };

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
      } catch {}
    } else {
      setSecondaryAddresses([]);
      setCustomTokens([]);
      setCustomNFTs([]);
    }
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=starknet,ethereum,usd-coin,lords,dai&vs_currencies=usd")
      .then(r => r.json())
      .then(data => {
        setPrices(prev => ({
          ...prev,
          ETH: data.ethereum?.usd || prev.ETH,
          STRK: data.starknet?.usd || prev.STRK,
          USDC: data["usd-coin"]?.usd || prev.USDC,
          LORDS: data.lords?.usd || prev.LORDS,
          DAI: data.dai?.usd || prev.DAI,
        }));
      })
      .catch(() => {});
  }, [connectedAddress]);

  const syncToLocalStorage = (sec: string[], tokens: TokenInfo[], nfts: NFTInfo[]) => {
    if (!connectedAddress) return;
    localStorage.setItem(
      `starknet_portfolio_${connectedAddress.toLowerCase()}`,
      JSON.stringify({ secondaryAddresses: sec, customTokens: tokens, customNFTs: nfts }),
    );
  };

  const fetchStarknetBalance = async (prov: any, token: string, user: string) => {
    const tryCall = async (entrypoint: string) => {
      try {
        const res = await prov.callContract({ contractAddress: token, entrypoint, calldata: [user] });
        const result = res?.result ?? res;
        if (Array.isArray(result)) {
          if (result.length >= 2) return (BigInt(result[1]) << 128n) + BigInt(result[0]);
          if (result.length === 1) return BigInt(result[0]);
        }
        return null;
      } catch { return null; }
    };
    return (await tryCall("balance_of")) ?? (await tryCall("balanceOf")) ?? 0n;
  };

  const fetchAllBalances = useCallback(async () => {
    if (!allAddresses.length || !provider) return;
    setIsLoading(true);
    const nb: Record<string, Record<string, number>> = {};
    try {
      for (const wallet of allAddresses) {
        nb[wallet] = {};
        for (const token of allTokens) {
          try {
            const raw = await fetchStarknetBalance(provider, token.address, wallet);
            nb[wallet][token.symbol] = parseFloat((Number(raw) / 10 ** token.decimals).toFixed(5));
          } catch { nb[wallet][token.symbol] = 0; }
        }
      }
      setBalances(nb);
    } catch {} finally { setIsLoading(false); }
  }, [allAddresses, allTokens, provider]);

  useEffect(() => { fetchAllBalances(); }, [fetchAllBalances]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success("Address copied!");
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAddSecondaryAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) { toast.error("Connect your wallet first!"); return; }
    const cleaned = newSecAddress.trim().toLowerCase();
    if (!/^0x[0-9a-fA-F]{1,64}$/.test(cleaned)) { toast.error("Invalid address format!"); return; }
    const formatted = cleaned.length < 66 ? "0x" + cleaned.slice(2).padStart(64, "0") : cleaned;
    if (allAddresses.some(a => a.toLowerCase() === formatted)) { toast.error("Already tracked!"); return; }
    const upd = [...secondaryAddresses, formatted];
    setSecondaryAddresses(upd);
    syncToLocalStorage(upd, customTokens, customNFTs);
    setNewSecAddress("");
    toast.success("Wallet linked!");
  };

  const handleRemoveSecondaryAddress = (addr: string) => {
    const upd = secondaryAddresses.filter(a => a !== addr);
    setSecondaryAddresses(upd);
    syncToLocalStorage(upd, customTokens, customNFTs);
    toast.success("Wallet removed");
  };

  const handleAddCustomToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) return;
    const addr = newTokenAddress.trim().toLowerCase();
    const sym = newTokenSymbol.trim().toUpperCase();
    if (!/^0x[0-9a-fA-F]{1,64}$/.test(addr)) { toast.error("Invalid address"); return; }
    if (!sym) { toast.error("Enter symbol"); return; }
    const tok: TokenInfo = { address: addr, symbol: sym, decimals: newTokenDecimals, label: `${sym} (Custom)`, isCustom: true };
    const upd = [...customTokens, tok];
    setCustomTokens(upd);
    syncToLocalStorage(secondaryAddresses, upd, customNFTs);
    setPrices(p => ({ ...p, [sym]: 1 }));
    setNewTokenAddress(""); setNewTokenSymbol(""); setNewTokenDecimals(18);
    toast.success(`${sym} added!`);
  };

  const handleRemoveCustomToken = (sym: string) => {
    const upd = customTokens.filter(t => t.symbol !== sym);
    setCustomTokens(upd);
    syncToLocalStorage(secondaryAddresses, upd, customNFTs);
  };

  const handleAddCustomNFT = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectedAddress) return;
    const nftAddr = newNFTAddress.trim().toLowerCase();
    const tokId = newNFTTokenId.trim();
    if (!/^0x[0-9a-fA-F]{1,64}$/.test(nftAddr)) { toast.error("Invalid address"); return; }
    const nft: NFTInfo = { id: `c_${Date.now()}`, name: newNFTName || `NFT #${tokId}`, collection: "Custom", imageUrl: "https://starknet.quest/assets/quests/starknetid/quest.png", contractAddress: nftAddr, tokenId: tokId, isCustom: true };
    const upd = [...customNFTs, nft];
    setCustomNFTs(upd);
    syncToLocalStorage(secondaryAddresses, customTokens, upd);
    setNewNFTAddress(""); setNewNFTTokenId(""); setNewNFTName("");
    toast.success("NFT added!");
  };

  const handleRemoveCustomNFT = (id: string) => {
    const upd = customNFTs.filter(n => n.id !== id);
    setCustomNFTs(upd);
    syncToLocalStorage(secondaryAddresses, customTokens, upd);
  };

  const tokenTotals = allTokens.reduce((acc, t) => {
    acc[t.symbol] = allAddresses.reduce((s, w) => s + (balances[w]?.[t.symbol] || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const totalUSDValue = allTokens.reduce((s, t) => s + (tokenTotals[t.symbol] || 0) * (prices[t.symbol] || 0), 0);

  const tc = THEMES[activeTheme];
  const barColors = ["bg-amber-400", "bg-purple-500", "bg-emerald-400", "bg-indigo-400", "bg-cyan-400"];

  return (
    <div className={`w-full min-h-screen ${tc.wrapper} transition-all duration-500 pb-24 font-sans`}>
      <Toaster position="bottom-right" />

      {/* Aurora subtle ambient — only for aurora/miami themes */}
      {activeTheme === "aurora" && (
        <>
          <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-700/8 blur-[150px] rounded-full pointer-events-none" />
          <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500/6 blur-[150px] rounded-full pointer-events-none" />
        </>
      )}
      {activeTheme === "miami" && (
        <>
          <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-pink-600/8 blur-[180px] rounded-full pointer-events-none" />
          <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/6 blur-[150px] rounded-full pointer-events-none" />
        </>
      )}

      <div className="max-w-7xl mx-auto px-4 pt-8 relative z-10">

        {/* ── THEME SWITCHER BAR ── */}
        <div className={`mb-8 ${tc.card} flex flex-col sm:flex-row justify-between items-center gap-4`}>
          <div className="flex items-center gap-2.5">
            <SparklesIcon className={`w-4 h-4 ${tc.accentText}`} />
            <span className={`text-xs font-black uppercase tracking-widest ${tc.accentText}`}>Design Lab</span>
            <span className={`text-xs ${tc.subtext}`}>— currently: {tc.emoji} {tc.label}</span>
          </div>
          <button
            onClick={() => setShowThemePicker(p => !p)}
            className={`text-xs font-bold uppercase tracking-wider px-4 py-2 ${tc.button}`}
          >
            {showThemePicker ? "▲ Close Picker" : "▼ Choose Design"}
          </button>
        </div>

        {/* ── THEME PICKER GRID ── */}
        {showThemePicker && (
          <div className={`mb-8 ${tc.card} p-6`}>
            <p className={`text-[10px] uppercase font-black tracking-widest mb-4 ${tc.subtext}`}>
              Select a design — {ALL_THEMES.length} available
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {ALL_THEMES.map(theme => {
                const t = THEMES[theme];
                return (
                  <button
                    key={theme}
                    onClick={() => handleThemeChange(theme)}
                    className={`flex flex-col items-center gap-1.5 py-4 px-3 text-center transition-all duration-200 ${
                      activeTheme === theme
                        ? `${tc.navBtnActive} scale-105 ring-2 ring-offset-0 ring-current`
                        : `${tc.button} hover:scale-105`
                    }`}
                  >
                    <span className="text-2xl leading-none">{t.emoji}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── HERO HEADER ── */}
        <div className={`${tc.hero} mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className={`text-[10px] tracking-widest font-black uppercase ${tc.subtext}`}>
                Live Mainnet · Multi-Address Tracker
              </span>
            </div>
            <h1 className={`text-3xl md:text-5xl font-black leading-none mb-2 ${tc.heading}`}>
              Starknet Portfolio
            </h1>
            <p className={`text-xs max-w-lg ${tc.subtext}`}>
              Monitor multiple Starknet wallets simultaneously. Track ERC-20 balances, custom tokens, and NFT holdings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {connectedAddress && (
              <div className={`flex items-center gap-3 px-4 py-3 border ${tc.divider} bg-transparent`}>
                <div>
                  <div className={`text-[8px] uppercase tracking-widest font-black mb-0.5 ${tc.subtext}`}>Connected</div>
                  <div className="text-xs font-mono font-bold">
                    {connectedAddress.slice(0, 8)}…{connectedAddress.slice(-6)}
                  </div>
                </div>
                <button onClick={() => handleCopy(connectedAddress)} className={`p-1.5 ${tc.button}`}>
                  {copiedText === connectedAddress
                    ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                    : <DocumentDuplicateIcon className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
            <button
              onClick={fetchAllBalances}
              disabled={isLoading}
              className={`flex items-center justify-center gap-2 ${tc.accentBg} transition-all disabled:opacity-50`}
            >
              <ArrowPathIcon className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Syncing…" : "Sync Balances"}
            </button>
          </div>
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* LEFT — Portfolio summary + wallet registry */}
          <div className="flex flex-col gap-6">

            {/* Net Worth Card */}
            <div className={tc.card}>
              <div className="flex justify-between items-center mb-5">
                <span className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 ${tc.accentText}`}>
                  <WalletIcon className="w-4 h-4" />
                  Total Net Worth
                </span>
                <span className={tc.badge}>{allAddresses.length} linked</span>
              </div>
              <div className="mb-5">
                <div className={`text-4xl md:text-5xl font-black leading-none ${tc.heading}`}>
                  <span className="text-xl">$</span>
                  {totalUSDValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              {/* Allocation bar */}
              <div className="h-2 w-full bg-black/20 flex overflow-hidden mb-3">
                {totalUSDValue > 0
                  ? allTokens.map((t, i) => {
                      const val = (tokenTotals[t.symbol] || 0) * (prices[t.symbol] || 0);
                      const pct = (val / totalUSDValue) * 100;
                      return pct > 0 ? <div key={t.symbol} className={barColors[i % 5]} style={{ width: `${pct}%` }} /> : null;
                    })
                  : <div className="bg-slate-800 w-full" />}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {allTokens.map((t, i) => {
                  const val = (tokenTotals[t.symbol] || 0) * (prices[t.symbol] || 0);
                  const pct = totalUSDValue > 0 ? (val / totalUSDValue) * 100 : 0;
                  return pct > 0 ? (
                    <span key={t.symbol} className="flex items-center gap-1 text-[10px] font-bold">
                      <span className={`w-1.5 h-1.5 rounded-full ${barColors[i % 5]}`} />
                      {t.symbol} {pct.toFixed(0)}%
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Linked Wallets Card */}
            <div className={tc.card}>
              <h3 className={`text-[10px] uppercase font-black tracking-widest mb-5 flex items-center gap-1.5 ${tc.accentText}`}>
                <CircleStackIcon className="w-4 h-4" />
                Linked Wallets
              </h3>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 mb-5">
                {connectedAddress && (
                  <div className={`p-3 flex justify-between items-center ${tc.rowHover}`}>
                    <div>
                      <div className={`text-[8px] uppercase tracking-widest font-black mb-0.5 ${tc.subtext}`}>Primary</div>
                      <div className="text-xs font-mono font-bold">
                        {connectedAddress.slice(0, 14)}…{connectedAddress.slice(-8)}
                      </div>
                    </div>
                    <span className={tc.badge}>Active</span>
                  </div>
                )}
                {secondaryAddresses.map(addr => (
                  <div key={addr} className={`p-3 flex justify-between items-center group ${tc.rowHover}`}>
                    <div>
                      <div className={`text-[8px] uppercase tracking-widest font-black mb-0.5 ${tc.subtext}`}>Tracked</div>
                      <div className="text-xs font-mono font-bold">
                        {addr.slice(0, 14)}…{addr.slice(-8)}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleCopy(addr)} className={`p-1 ${tc.button}`} title="Copy">
                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleRemoveSecondaryAddress(addr)} className="p-1 hover:text-red-400" title="Remove">
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSecondaryAddress} className={`pt-4 border-t ${tc.divider}`}>
                <div className={`text-[8px] uppercase tracking-widest font-black mb-2 ${tc.subtext}`}>Link Another Wallet</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="0x04718…"
                    value={newSecAddress}
                    onChange={e => setNewSecAddress(e.target.value)}
                    className={`flex-1 ${tc.input}`}
                  />
                  <button type="submit" className={tc.button}>
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT — Asset tabs */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Tab bar */}
            <div className={`flex items-center gap-1.5 ${tc.card} w-fit`}>
              {(["tokens", "nfts"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all ${
                    activeTab === tab ? tc.navBtnActive : tc.navBtnInactive
                  }`}
                >
                  {tab === "tokens" ? <CurrencyDollarIcon className="w-4 h-4" /> : <PhotoIcon className="w-4 h-4" />}
                  {tab === "tokens" ? "Tokens" : "NFTs"}
                </button>
              ))}
            </div>

            {/* TOKENS TAB */}
            {activeTab === "tokens" && (
              <div className="space-y-6">
                <div className={tc.card}>
                  <h3 className={`text-[10px] uppercase font-black tracking-widest mb-5 ${tc.accentText}`}>
                    Asset Breakdown
                  </h3>
                  <div className="space-y-2">
                    {allTokens.map((token, i) => {
                      const amt = tokenTotals[token.symbol] || 0;
                      const usd = amt * (prices[token.symbol] || 0);
                      return (
                        <div
                          key={token.symbol}
                          className={`flex items-center justify-between p-3.5 transition-all group ${tc.rowHover}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${barColors[i % 5]}`} />
                            <div>
                              <div className="font-black text-sm leading-tight">{token.symbol}</div>
                              <div className={`text-[10px] uppercase tracking-wider ${tc.subtext}`}>{token.label}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-black text-sm">{amt.toLocaleString(undefined, { maximumFractionDigits: 5 })}</div>
                              <div className={`text-xs font-bold ${tc.accentText}`}>
                                ${usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                            {token.isCustom ? (
                              <button onClick={() => handleRemoveCustomToken(token.symbol)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 transition-all">
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              <a href={`https://starkscan.co/token/${token.address}`} target="_blank" rel="noreferrer" className={`opacity-0 group-hover:opacity-100 p-1.5 ${tc.subtext} hover:opacity-80 transition-all`}>
                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Add Custom Token */}
                <div className={tc.card}>
                  <h3 className={`text-[10px] uppercase font-black tracking-widest mb-5 flex items-center gap-1.5 ${tc.accentText}`}>
                    <PlusIcon className="w-4 h-4" /> Register Custom Token
                  </h3>
                  <form onSubmit={handleAddCustomToken} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div className="md:col-span-2">
                      <div className={`text-[8px] uppercase tracking-widest font-black mb-1.5 ${tc.subtext}`}>Contract Address</div>
                      <input type="text" placeholder="0x049d365…" value={newTokenAddress} onChange={e => setNewTokenAddress(e.target.value)} className={`w-full ${tc.input}`} />
                    </div>
                    <div>
                      <div className={`text-[8px] uppercase tracking-widest font-black mb-1.5 ${tc.subtext}`}>Symbol</div>
                      <input type="text" placeholder="LORDS" value={newTokenSymbol} onChange={e => setNewTokenSymbol(e.target.value)} className={`w-full ${tc.input}`} />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className={`text-[8px] uppercase tracking-widest font-black mb-1.5 ${tc.subtext}`}>Decimals</div>
                        <input type="number" value={newTokenDecimals} onChange={e => setNewTokenDecimals(parseInt(e.target.value) || 18)} className={`w-full ${tc.input}`} />
                      </div>
                      <button type="submit" className={`self-end ${tc.button}`}><PlusIcon className="w-4 h-4" /></button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* NFTS TAB */}
            {activeTab === "nfts" && (
              <div className="space-y-6">
                <div className={tc.card}>
                  <h3 className={`text-[10px] uppercase font-black tracking-widest mb-5 ${tc.accentText}`}>
                    NFT Gallery
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[...PRELOADED_NFTS, ...customNFTs].map(nft => (
                      <div key={nft.id} className={`overflow-hidden flex flex-col transition-all group ${tc.rowHover}`}>
                        <div className="h-44 relative overflow-hidden bg-black/30">
                          <img src={nft.imageUrl} alt={nft.name} className="object-cover w-full h-full" />
                          <span className={`absolute top-3 left-3 text-[8px] uppercase tracking-widest font-black px-2 py-1 ${tc.badge}`}>
                            {nft.isCustom ? "Custom" : "Collection"}
                          </span>
                          {nft.isCustom && (
                            <button
                              onClick={() => handleRemoveCustomNFT(nft.id)}
                              className="absolute top-3 right-3 p-1.5 bg-red-900/80 text-red-400 border border-red-700 hover:bg-red-600 hover:text-white transition-colors"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                          <div>
                            <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${tc.accentText}`}>{nft.collection}</div>
                            <div className="text-sm font-extrabold leading-tight">{nft.name}</div>
                          </div>
                          <div className={`flex justify-between items-center pt-2 border-t ${tc.divider} text-[10px] font-mono ${tc.subtext}`}>
                            <span>#{nft.tokenId}</span>
                            <a href={`https://starkscan.co/nft/${nft.contractAddress}/${nft.tokenId}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                              View <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Custom NFT */}
                <div className={tc.card}>
                  <h3 className={`text-[10px] uppercase font-black tracking-widest mb-5 flex items-center gap-1.5 ${tc.accentText}`}>
                    <PlusIcon className="w-4 h-4" /> Register Custom NFT
                  </h3>
                  <form onSubmit={handleAddCustomNFT} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    <div>
                      <div className={`text-[8px] uppercase tracking-widest font-black mb-1.5 ${tc.subtext}`}>Contract Address</div>
                      <input type="text" placeholder="0x05dbcf…" value={newNFTAddress} onChange={e => setNewNFTAddress(e.target.value)} className={`w-full ${tc.input}`} />
                    </div>
                    <div>
                      <div className={`text-[8px] uppercase tracking-widest font-black mb-1.5 ${tc.subtext}`}>Token ID</div>
                      <input type="text" placeholder="452" value={newNFTTokenId} onChange={e => setNewNFTTokenId(e.target.value)} className={`w-full ${tc.input}`} />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className={`text-[8px] uppercase tracking-widest font-black mb-1.5 ${tc.subtext}`}>Name (optional)</div>
                        <input type="text" placeholder="Quest Shield" value={newNFTName} onChange={e => setNewNFTName(e.target.value)} className={`w-full ${tc.input}`} />
                      </div>
                      <button type="submit" className={`self-end ${tc.button}`}><PlusIcon className="w-4 h-4" /></button>
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
