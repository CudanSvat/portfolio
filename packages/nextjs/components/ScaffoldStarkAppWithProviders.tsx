"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import { StarknetConfig } from "@starknet-start/react";
import { voyager } from "@starknet-start/explorers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "~~/components/Header";

import { appChains, extraWallets } from "~~/services/web3/connectors";
import provider from "~~/services/web3/provider";
import { useNativeCurrencyPrice } from "~~/hooks/scaffold-stark/useNativeCurrencyPrice";

const queryClient = new QueryClient();

const Footer = dynamic(
  () => import("~~/components/Footer").then((mod) => mod.Footer),
  {
    ssr: false,
  },
);

const ScaffoldStarkApp = ({ children }: { children: React.ReactNode }) => {
  useNativeCurrencyPrice();
  return (
    <>
      <div className="flex relative flex-col min-h-screen bg-[#070913] text-[#F3F4F6] font-sans select-none">
        {/* Glow ambient background mesh lights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

export const ScaffoldStarkAppWithProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StarknetConfig
        chains={[...appChains]}
        provider={provider}
        explorer={voyager}
        autoConnect={false}
        extraWallets={extraWallets}
      >
        <ScaffoldStarkApp>{children}</ScaffoldStarkApp>
      </StarknetConfig>
    </QueryClientProvider>
  );
};
