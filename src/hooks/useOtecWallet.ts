

// CertiLink - OTEC Institutional Wallet Hook
// Manages the connection between Phantom wallet and the OTEC profile
// UI terminology: "Autorización institucional" not "wallet"

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/hooks/useAuth";
import { saveOtecWallet, getOtecWallet } from "@/lib/solana";

interface OtecWalletState {
  /** Whether the OTEC has a wallet saved in their profile */
  isRegistered: boolean;
  /** The saved wallet address */
  savedAddress: string | null;
  /** Whether the Phantom wallet is currently connected */
  isConnected: boolean;
  /** The currently connected wallet address */
  connectedAddress: string | null;
  /** Whether saved address matches connected address */
  isVerified: boolean;
  /** Loading state */
  loading: boolean;
  /** Register the currently connected wallet to the OTEC profile */
  registerWallet: () => Promise<void>;
  /** Refresh the wallet state */
  refresh: () => Promise<void>;
}

export function useOtecWallet(): OtecWalletState {
  const { otec, refreshOtec, patchOtec } = useAuth();
  const { publicKey, connected } = useWallet();
  const [savedAddress, setSavedAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const connectedAddress = publicKey?.toBase58() || null;
  const isVerified = !!(savedAddress && connectedAddress && savedAddress === connectedAddress);

  const fetchSavedWallet = useCallback(async () => {
    if (!otec) return;
    setLoading(true);
    try {
      const address = await getOtecWallet(otec.id);
      setSavedAddress(address);
    } catch {
      setSavedAddress(null);
    } finally {
      setLoading(false);
    }
  }, [otec]);

  useEffect(() => {
    fetchSavedWallet();
  }, [fetchSavedWallet]);

  const registerWallet = async () => {
    if (!otec || !connectedAddress) {
      throw new Error("Conecte su billetera institucional primero");
    }
    await saveOtecWallet(otec.id, connectedAddress);
    setSavedAddress(connectedAddress);
    patchOtec({ wallet_address: connectedAddress });
    await refreshOtec();
  };

  return {
    isRegistered: !!savedAddress,
    savedAddress,
    isConnected: connected,
    connectedAddress,
    isVerified,
    loading,
    registerWallet,
    refresh: fetchSavedWallet,
  };
}