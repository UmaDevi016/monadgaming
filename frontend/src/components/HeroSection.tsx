"use client";
import styles from "./HeroSection.module.css";

interface HeroProps { onStart: () => void; }

export function HeroSection({ onStart }: HeroProps) {
    const features = [
        { icon: "🤖", title: "AI Game Design", desc: "Describe any game in plain English. AI refines your idea into a full design." },
        { icon: "⛓️", title: "Monad Blockchain", desc: "Lightning-fast, EVM-compatible deployment at near-zero cost." },
        { icon: "🎮", title: "Real-time Multiplayer", desc: "WebSocket-powered rooms. Play with anyone, anywhere, instantly." },
        { icon: "🖼️", title: "NFT Ownership", desc: "Every game is minted as an ERC-721 NFT — yours forever on-chain." },
    ];

    const genres = ["🧩 Puzzle", "⚔️ RPG", "♟️ Strategy", "🎯 Arcade", "❓ Trivia", "🗺️ Adventure"];

    const steps = [
        { n: "01", title: "Chat & Design", desc: "Tell the AI your game idea. It asks smart questions to refine your vision." },
        { n: "02", title: "Generate & Preview", desc: "Complete HTML5 game code generated instantly. Play it in your browser." },
        { n: "03", title: "Deploy & Mint", desc: "One click deploys to Monad and mints your game as a unique NFT." },
        { n: "04", title: "Share & Compete", desc: "Invite friends, track scores on the leaderboard, earn community rewards." },
    ];

    const stats = [
        { value: "< 1s", label: "Block time" },
        { value: "0.0001", label: "MON per mint" },
        { value: "EVM", label: "Compatible" },
        { value: "Free", label: "Game creation" },
    ];

    return (
        <>
            <div className={styles.hero}>
                {/* Ambient orbs */}
                <div className={styles.orb1} />
                <div className={styles.orb2} />
                <div className={styles.orb3} />

                <div className={styles.content}>
                    {/* Live badge */}
                    <div className={styles.badge}>
                        <span className={styles.badgeDot} />
                        Live on Monad Testnet · 10,000 TPS
                    </div>

                    {/* Hero title */}
                    <h1 className={styles.title}>
                        Create Any Game
                        <span className={styles.titleHighlight}>With AI, Deploy to Chain</span>
                    </h1>

                    <p className={styles.subtitle}>
                        Have a conversation with our AI. Describe your dream game.
                        Watch it generate, deploy, and mint — in minutes.
                    </p>

                    {/* Genre chips */}
                    <div className={styles.genres}>
                        {genres.map((g) => (
                            <span key={g} className={styles.genreTag}>{g}</span>
                        ))}
                    </div>

                    {/* CTA buttons */}
                    <div className={styles.ctas}>
                        <button
                            className={`btn-primary ${styles.ctaPrimary}`}
                            onClick={onStart}
                        >
                            🚀 Start Building
                        </button>
                        <a
                            href="https://testnet.monadexplorer.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`btn-secondary ${styles.ctaSecondary}`}
                        >
                            🔍 View on Explorer
                        </a>
                    </div>

                    {/* Stats bar */}
                    <div className={styles.stats}>
                        {stats.map((s) => (
                            <div key={s.label} className={styles.stat}>
                                <div className={styles.statValue}>{s.value}</div>
                                <div className={styles.statLabel}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feature cards — below hero */}
            <div className={styles.features}>
                {features.map((f, i) => (
                    <div
                        key={f.title}
                        className={`${styles.featureCard} glass card-glow`}
                        style={{ animationDelay: `${i * 0.08}s` }}
                    >
                        <div className={styles.featureIcon}>{f.icon}</div>
                        <div className={styles.featureTitle}>{f.title}</div>
                        <div className={styles.featureDesc}>{f.desc}</div>
                    </div>
                ))}
            </div>

            {/* How it works */}
            <div className={styles.steps}>
                <h2 className={styles.stepsTitle}>How It Works</h2>
                <div className={styles.stepsGrid}>
                    {steps.map((s) => (
                        <div key={s.n} className={`${styles.step} glass card-glow`}>
                            <div className={styles.stepNum}>{s.n}</div>
                            <div className={styles.stepTitle}>{s.title}</div>
                            <div className={styles.stepDesc}>{s.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
