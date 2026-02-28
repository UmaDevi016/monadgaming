"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import { ethers } from "ethers";

const MONAD_CHAIN_ID = Number(
    process.env.NEXT_PUBLIC_MONAD_CHAIN_ID || "10143"
);

const MONAD_NETWORK = {
    chainId: `0x${MONAD_CHAIN_ID.toString(16)}`,
    chainName: process.env.NEXT_PUBLIC_MONAD_CHAIN_NAME || "Monad Testnet",
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"],
    blockExplorerUrls: [
        process.env.NEXT_PUBLIC_MONAD_EXPLORER || "https://testnet.monadexplorer.com",
    ],
};

interface Web3ContextType {
    address: string | null;
    isConnected: boolean;
    isConnecting: boolean;
    chainId: number | null;
    isMonadNetwork: boolean;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    switchToMonad: () => Promise<void>;
    signMessage: (message: string) => Promise<string>;
    balance: string;
}

const Web3Context = createContext<Web3ContextType>({} as Web3ContextType);

export function Web3Provider({ children }: { children: ReactNode }) {
    const [address, setAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [chainId, setChainId] = useState<number | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
    const [balance, setBalance] = useState("0");

    const updateBalance = useCallback(
        async (addr: string, prov: ethers.BrowserProvider) => {
            try {
                const bal = await prov.getBalance(addr);
                setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
            } catch {
                setBalance("0");
            }
        },
        []
    );

    const initProvider = useCallback(async () => {
        if (typeof window === "undefined" || !window.ethereum) return;

        const prov = new ethers.BrowserProvider(window.ethereum);
        const network = await prov.getNetwork();
        setChainId(Number(network.chainId));
        setProvider(prov);

        const accounts = await prov.listAccounts();
        if (accounts.length > 0) {
            const addr = accounts[0].address;
            const sig = await prov.getSigner();
            setAddress(addr);
            setSigner(sig);
            await updateBalance(addr, prov);
        }
    }, [updateBalance]);

    useEffect(() => {
        initProvider();

        if (typeof window !== "undefined" && window.ethereum) {
            window.ethereum.on("accountsChanged", (accounts: string[]) => {
                if (accounts.length === 0) {
                    setAddress(null);
                    setSigner(null);
                } else {
                    setAddress(accounts[0]);
                    initProvider();
                }
            });

            window.ethereum.on("chainChanged", () => {
                initProvider();
            });
        }

        return () => {
            if (window.ethereum?.removeAllListeners) {
                window.ethereum.removeAllListeners("accountsChanged");
                window.ethereum.removeAllListeners("chainChanged");
            }
        };
    }, [initProvider]);

    const connect = useCallback(async () => {
        if (!window.ethereum) {
            window.open("https://metamask.io/download/", "_blank");
            return;
        }

        setIsConnecting(true);
        try {
            const prov = new ethers.BrowserProvider(window.ethereum);
            await prov.send("eth_requestAccounts", []);

            const network = await prov.getNetwork();
            setChainId(Number(network.chainId));

            const sig = await prov.getSigner();
            const addr = await sig.getAddress();

            setProvider(prov);
            setSigner(sig);
            setAddress(addr);
            await updateBalance(addr, prov);

            // Auto-switch to Monad if needed
            if (Number(network.chainId) !== MONAD_CHAIN_ID) {
                await switchToMonad();
            }
        } catch (err) {
            console.error("Connect error:", err);
        } finally {
            setIsConnecting(false);
        }
    }, [updateBalance]);

    const disconnect = useCallback(() => {
        setAddress(null);
        setSigner(null);
        setProvider(null);
        setChainId(null);
        setBalance("0");
    }, []);

    const switchToMonad = useCallback(async () => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: MONAD_NETWORK.chainId }],
            });
        } catch (err: any) {
            if (err.code === 4902) {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [MONAD_NETWORK],
                });
            }
        }
    }, []);

    const signMessage = useCallback(
        async (message: string) => {
            if (!signer) throw new Error("Not connected");
            return signer.signMessage(message);
        },
        [signer]
    );

    return (
        <Web3Context.Provider
            value={{
                address,
                isConnected: !!address,
                isConnecting,
                chainId,
                isMonadNetwork: chainId === MONAD_CHAIN_ID,
                provider,
                signer,
                connect,
                disconnect,
                switchToMonad,
                signMessage,
                balance,
            }}
        >
            {children}
        </Web3Context.Provider>
    );
}

export const useWeb3 = () => useContext(Web3Context);
