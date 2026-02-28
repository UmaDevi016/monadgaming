"use client";

import { useEffect, useState } from "react";
import { fetchLeaderboard, fetchPlayerScore } from "@/lib/api";
import { useWeb3 } from "@/lib/Web3Context";
import styles from "./Leaderboard.module.css";

interface ScoreEntry {
    walletAddress: string;
    gameId: string;
    score: number;
    gameName: string;
    timestamp: number;
}

export function Leaderboard() {
    const { address } = useWeb3();
    const [entries, setEntries] = useState<ScoreEntry[]>([]);
    const [playerStats, setPlayerStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<"global" | "mine">("global");

    useEffect(() => {
        fetchLeaderboard()
            .then(setEntries)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    useEffect(() => {
        if (address && view === "mine") {
            fetchPlayerScore(address)
                .then(setPlayerStats)
                .catch(console.error);
        }
    }, [address, view]);

    const rankIcon = (i: number) => {
        if (i === 0) return "🥇";
        if (i === 1) return "🥈";
        if (i === 2) return "🥉";
        return `#${i + 1}`;
    };

    const formatAddress = (addr: string) =>
        `${addr.slice(0, 6)}…${addr.slice(-4)}`;

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>🏆 Leaderboard</h1>
                    <p className={styles.subtitle}>Top players across all ChainCraft games on Monad</p>
                </div>
                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.toggleBtn} ${view === "global" ? styles.toggleActive : ""}`}
                        onClick={() => setView("global")}
                    >
                        Global
                    </button>
                    <button
                        className={`${styles.toggleBtn} ${view === "mine" ? styles.toggleActive : ""}`}
                        onClick={() => setView("mine")}
                    >
                        My Stats
                    </button>
                </div>
            </div>

            {view === "global" && (
                <>
                    {/* Top 3 Podium */}
                    {!isLoading && entries.length >= 3 && (
                        <div className={styles.podium}>
                            <PodiumCard rank={1} entry={entries[1]} />
                            <PodiumCard rank={0} entry={entries[0]} isTop />
                            <PodiumCard rank={2} entry={entries[2]} />
                        </div>
                    )}

                    {/* Table */}
                    <div className={`${styles.table} glass`}>
                        <div className={styles.tableHeader}>
                            <span>Rank</span>
                            <span>Player</span>
                            <span>Game</span>
                            <span>Score</span>
                            <span>Date</span>
                        </div>

                        {isLoading ? (
                            <div className={styles.loading}>
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className={`${styles.skeletonRow} skeleton`} />
                                ))}
                            </div>
                        ) : entries.length === 0 ? (
                            <div className={styles.empty}>
                                <p>🎮 No scores yet. Play a game to get on the board!</p>
                            </div>
                        ) : (
                            entries.map((entry, i) => (
                                <div
                                    key={`${entry.walletAddress}-${i}`}
                                    className={`${styles.tableRow} ${entry.walletAddress === address ? styles.myRow : ""}`}
                                >
                                    <span className={styles.rank}>{rankIcon(i)}</span>
                                    <span className={styles.player}>
                                        <span className={styles.playerAddr}>{formatAddress(entry.walletAddress)}</span>
                                        {entry.walletAddress === address && (
                                            <span className="badge badge-teal">You</span>
                                        )}
                                    </span>
                                    <span className={styles.gameName}>{entry.gameName || "Unknown"}</span>
                                    <span className={styles.score}>{entry.score.toLocaleString()}</span>
                                    <span className={styles.date}>{formatTime(entry.timestamp)}</span>
                                </div>
                            ))
                        )}

                        {/* Demo entries when empty */}
                        {!isLoading && entries.length === 0 && (
                            <div className={styles.demoEntries}>
                                {DEMO_ENTRIES.map((entry, i) => (
                                    <div key={i} className={styles.tableRow}>
                                        <span className={styles.rank}>{rankIcon(i)}</span>
                                        <span className={styles.player}>
                                            <span className={styles.playerAddr}>{formatAddress(entry.walletAddress)}</span>
                                        </span>
                                        <span className={styles.gameName}>{entry.gameName}</span>
                                        <span className={styles.score}>{entry.score.toLocaleString()}</span>
                                        <span className={styles.date}>Demo</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {view === "mine" && (
                <div className={styles.myStats}>
                    {!address ? (
                        <div className={styles.connectPrompt}>
                            <div className={styles.connectIcon}>🦊</div>
                            <h3>Connect your wallet to see your stats</h3>
                        </div>
                    ) : !playerStats ? (
                        <div className={styles.noStats}>
                            <p>No games played yet. Start playing to see your stats!</p>
                        </div>
                    ) : (
                        <div className={styles.statsGrid}>
                            <div className={`${styles.statCard} glass`}>
                                <div className={styles.statNum}>{playerStats.totalScore.toLocaleString()}</div>
                                <div className={styles.statLbl}>Total Score</div>
                            </div>
                            <div className={`${styles.statCard} glass`}>
                                <div className={styles.statNum}>{playerStats.gamesPlayed}</div>
                                <div className={styles.statLbl}>Games Played</div>
                            </div>
                            <div className={`${styles.statCard} glass`}>
                                <div className={styles.statNum}>
                                    {playerStats.gamesPlayed > 0
                                        ? Math.round(playerStats.totalScore / playerStats.gamesPlayed).toLocaleString()
                                        : 0}
                                </div>
                                <div className={styles.statLbl}>Avg Score</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function PodiumCard({ rank, entry, isTop }: { rank: number; entry: ScoreEntry; isTop?: boolean }) {
    const medals = ["🥇", "🥈", "🥉"];
    return (
        <div className={`${styles.podiumCard} glass ${isTop ? styles.podiumTop : ""}`}>
            <div className={styles.podiumMedal}>{medals[rank]}</div>
            <div className={styles.podiumAddr}>
                {entry.walletAddress.slice(0, 6)}…{entry.walletAddress.slice(-4)}
            </div>
            <div className={styles.podiumScore}>{entry.score.toLocaleString()}</div>
            <div className={styles.podiumGame}>{entry.gameName}</div>
        </div>
    );
}

const DEMO_ENTRIES = [
    { walletAddress: "0x1234567890abcdef1234567890abcdef12345678", score: 98240, gameName: "Monad Breaker" },
    { walletAddress: "0xabcdef1234567890abcdef1234567890abcdef12", score: 87150, gameName: "Chain Chess" },
    { walletAddress: "0x7890abcdef1234567890abcdef1234567890abcd", score: 76820, gameName: "Crypto Trivia" },
    { walletAddress: "0xef1234567890abcdef1234567890abcdef123456", score: 65400, gameName: "Monad Breaker" },
    { walletAddress: "0x4567890abcdef1234567890abcdef1234567890a", score: 54190, gameName: "Chain Chess" },
];
