"use client";

import { useWeb3 } from "@/lib/Web3Context";
import styles from "./Navbar.module.css";

interface NavbarProps {
    activeTab: "create" | "browse" | "leaderboard";
    onTabChange: (tab: "create" | "browse" | "leaderboard") => void;
}

export function Navbar({ activeTab, onTabChange }: NavbarProps) {
    const { address, balance, isConnecting, connectWallet, switchToMonad } = useWeb3();

    const shortAddr = address
        ? `${address.slice(0, 6)}…${address.slice(-4)}`
        : null;

    const tabs = [
        { id: "create" as const, icon: "✦", label: "Create" },
        { id: "browse" as const, icon: "◈", label: "Browse" },
        { id: "leaderboard" as const, icon: "⬡", label: "Leaderboard" },
    ];

    return (
        <nav className={styles.nav}>
            {/* Brand */}
            <div className={styles.brand}>
                <div className={styles.logo}>⛓</div>
                <span className={styles.brandName}>ChainCraft</span>
                <span className={styles.monadBadge}>Monad</span>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ""}`}
                        onClick={() => onTabChange(t.id)}
                    >
                        <span className={styles.tabIcon}>{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Right side */}
            <div className={styles.right}>
                {address ? (
                    <>
                        {/* Network pill */}
                        <button className={styles.networkPill} onClick={switchToMonad}>
                            <span className="status-dot" />
                            Monad
                        </button>

                        {/* Balance */}
                        {balance && (
                            <div className={styles.balance}>
                                {parseFloat(balance).toFixed(4)} MON
                            </div>
                        )}

                        {/* Wallet address */}
                        <button className={`${styles.walletBtn} ${styles.walletConnected}`}>
                            <span>🦊</span>
                            <span className={styles.addrText}>{shortAddr}</span>
                        </button>
                    </>
                ) : (
                    <button
                        className={styles.walletBtn}
                        onClick={connectWallet}
                        disabled={isConnecting}
                    >
                        {isConnecting ? (
                            <>
                                <span style={{ animation: "spin-slow 1s linear infinite", display: "inline-block" }}>⟳</span>
                                Connecting…
                            </>
                        ) : (
                            <>
                                <span>🦊</span>
                                Connect Wallet
                            </>
                        )}
                    </button>
                )}
            </div>
        </nav>
    );
}
