"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchGames } from "@/lib/api";
import styles from "./GameBrowser.module.css";

const GENRES = ["All", "puzzle", "rpg", "strategy", "arcade", "trivia", "adventure"];

interface GameSession {
    id: string;
    name: string;
    genre: string;
    description: string;
    creator: string;
    players: number;
    maxPlayers: number;
    isDeployed: boolean;
    tokenId?: number;
    contractAddress?: string;
    createdAt: number;
}

export function GameBrowser() {
    const [games, setGames] = useState<GameSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchGames()
            .then(setGames)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const filtered = games.filter((g) => {
        const matchGenre = filter === "All" || g.genre === filter;
        const matchSearch =
            !search ||
            g.name.toLowerCase().includes(search.toLowerCase()) ||
            g.description.toLowerCase().includes(search.toLowerCase());
        return matchGenre && matchSearch;
    });

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Game Browser</h1>
                    <p className={styles.subtitle}>
                        Play games created by the ChainCraft community
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="🔍 Search games…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.search}
                />
                <div className={styles.genreFilters}>
                    {GENRES.map((g) => (
                        <button
                            key={g}
                            className={`${styles.genreBtn} ${filter === g ? styles.genreBtnActive : ""}`}
                            onClick={() => setFilter(g)}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* Games Grid */}
            {isLoading ? (
                <div className={styles.skeletonGrid}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={`${styles.skeletonCard} skeleton`} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>🎮</div>
                    <h3>No games found</h3>
                    <p>Be the first to create a game with the AI!</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {filtered.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            )}

            {/* Demo cards when no games */}
            {!isLoading && games.length === 0 && (
                <div className={styles.demoSection}>
                    <div className={styles.demoNote}>
                        💡 No games created yet. The games you create with the AI will appear here!
                    </div>
                    <div className={styles.grid}>
                        {DEMO_GAMES.map((game) => (
                            <GameCard key={game.id} game={game} isDemo />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function GameCard({ game, isDemo }: { game: any; isDemo?: boolean }) {
    const genreEmojis: Record<string, string> = {
        puzzle: "🧩", rpg: "⚔️", strategy: "♟️",
        arcade: "🎯", trivia: "❓", adventure: "🗺️", misc: "🎮",
    };

    return (
        <div className={`${styles.card} glass card-glow ${isDemo ? styles.cardDemo : ""}`}>
            <div className={styles.cardTop}>
                <div className={styles.cardEmoji}>{genreEmojis[game.genre] || "🎮"}</div>
                <div className={styles.cardBadges}>
                    <span className="badge badge-purple">{game.genre}</span>
                    {game.isDeployed && <span className="badge badge-green">⛓️ On-Chain</span>}
                    {isDemo && <span className="badge badge-teal">Demo</span>}
                </div>
            </div>

            <h3 className={styles.cardName}>{game.name}</h3>
            <p className={styles.cardDesc}>{game.description}</p>

            <div className={styles.cardMeta}>
                <span className={styles.metaItem}>
                    👥 {game.players || 0} / {game.maxPlayers} players
                </span>
                <span className={styles.metaItem}>
                    👤 {game.creator?.slice(0, 8) || "Creator"}…
                </span>
            </div>

            {game.tokenId && (
                <div className={styles.nftBadge}>NFT #{game.tokenId}</div>
            )}

            <div className={styles.cardActions}>
                <button
                    className="btn-primary"
                    style={{ width: "100%", justifyContent: "center" }}
                    onClick={() => isDemo ? alert("Connect your wallet and create a real game!") : null}
                >
                    {isDemo ? "🎮 Demo" : "▶ Play Now"}
                </button>
            </div>
        </div>
    );
}

const DEMO_GAMES = [
    {
        id: "demo-1",
        name: "Monad Breaker",
        genre: "arcade",
        description: "A classic brick-breaker game with a Monad blockchain twist. Break blocks to earn MON tokens!",
        creator: "0xCreator1",
        players: 142,
        maxPlayers: 1,
        isDeployed: true,
        tokenId: 1,
    },
    {
        id: "demo-2",
        name: "Chain Chess",
        genre: "strategy",
        description: "On-chain chess where moves are recorded on Monad. Challenge friends to eternal games.",
        creator: "0xCreator2",
        players: 89,
        maxPlayers: 2,
        isDeployed: true,
        tokenId: 2,
    },
    {
        id: "demo-3",
        name: "Crypto Trivia",
        genre: "trivia",
        description: "Test your crypto and blockchain knowledge. 50 questions across DeFi, NFTs, and Web3.",
        creator: "0xCreator3",
        players: 317,
        maxPlayers: 8,
        isDeployed: true,
        tokenId: 3,
    },
];
