"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWeb3 } from "@/lib/Web3Context";
import { sendChatMessage, mintGame } from "@/lib/api";
import { GamePreview } from "./GamePreview";
import styles from "./ChatBuilder.module.css";

type Phase = "GATHERING" | "DESIGNING" | "GENERATING" | "DEPLOYING";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: number;
}

interface GameDesign {
    name: string;
    genre: string;
    description: string;
    rules: string[];
    maxPlayers: number;
    winCondition: string;
}

const PHASES: Phase[] = ["GATHERING", "DESIGNING", "GENERATING", "DEPLOYING"];
const PHASE_ICONS: Record<Phase, string> = {
    GATHERING: "1", DESIGNING: "2", GENERATING: "3", DEPLOYING: "4",
};
const PHASE_LABELS: Record<Phase, string> = {
    GATHERING: "Gathering",
    DESIGNING: "Designing",
    GENERATING: "Generating",
    DEPLOYING: "Deploying",
};

export function ChatBuilder() {
    const { address, isConnected, connectWallet } = useWeb3();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentPhase, setCurrentPhase] = useState<Phase>("GATHERING");
    const [gameDesign, setGameDesign] = useState<GameDesign | null>(null);
    const [gameCode, setGameCode] = useState<string | null>(null);
    const [isMinting, setIsMinting] = useState(false);
    const [mintResult, setMintResult] = useState<any>(null);
    const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        setMessages([{
            id: "welcome",
            role: "assistant",
            content: "Welcome to ChainCraft AI! I'm your game design partner.\n\nTell me about the game you want to create. Try something like:\n- \"I want a fast-paced asteroid shooter\"\n- \"Create a multiplayer trivia game about crypto\"\n- \"Make a turn-based strategy RPG\"\n\nWhat kind of game should we build?",
            timestamp: Date.now(),
        }]);
    }, []);

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    const sendMessage = useCallback(async () => {
        if (!input.trim() || isLoading) return;
        const text = input.trim();

        const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: text, timestamp: Date.now() };
        const newHistory = [...chatHistory, { role: "user", content: text }];

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setIsLoading(true);

        try {
            const result = await sendChatMessage({
                message: text,
                sessionId: sessionId || undefined,
                chatHistory,
                walletAddress: address || undefined,
            });
            const aiResp = result.response;
            setSessionId(result.sessionId);
            setCurrentPhase(aiResp.phase);
            if (aiResp.gameDesign) setGameDesign(aiResp.gameDesign);
            if (aiResp.gameCode) setGameCode(aiResp.gameCode);

            const aiMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: aiResp.message, timestamp: Date.now() };
            setChatHistory([...newHistory, { role: "assistant", content: aiResp.message }]);
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err: any) {
            setMessages((prev) => [...prev, {
                id: `e-${Date.now()}`, role: "assistant",
                content: `⚠️ ${err.message ?? "Connection error"}. Make sure the backend server is running on port 4000.`,
                timestamp: Date.now(),
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    }, [input, isLoading, sessionId, chatHistory, address]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const handleMint = async () => {
        if (!isConnected) { connectWallet(); return; }
        if (!sessionId || !address) return;
        setIsMinting(true);
        try {
            const result = await mintGame({ sessionId, walletAddress: address });
            setMintResult(result);
        } catch (err: any) {
            alert(`Minting failed: ${err.message}`);
        } finally {
            setIsMinting(false);
        }
    };

    const phaseIdx = PHASES.indexOf(currentPhase);

    return (
        <div className={styles.wrapper}>
            {/* ─── Left: Chat Panel ─────────────────────── */}
            <div className={styles.chatPanel}>

                {/* Phase stepper */}
                <div className={styles.stepper}>
                    {PHASES.map((phase, i) => {
                        const isActive = i === phaseIdx;
                        const isDone = i < phaseIdx;
                        return (
                            <div
                                key={phase}
                                className={`${styles.step} ${isActive ? styles.stepActive : ""} ${isDone ? styles.stepDone : ""}`}
                            >
                                <div className={styles.stepDot}>
                                    {isDone ? "✓" : PHASE_ICONS[phase]}
                                </div>
                                <span className={styles.stepLabel}>{PHASE_LABELS[phase]}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Messages */}
                <div className={styles.messages}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={`${styles.msgRow} ${msg.role === "user" ? styles.user : ""}`}>
                            <div className={`${styles.msgAvatar} ${msg.role === "assistant" ? styles.aiAvatar : styles.userAvatar}`}>
                                {msg.role === "assistant" ? "⛓" : "👤"}
                            </div>
                            <div className={`${styles.bubble} ${msg.role === "assistant" ? styles.aiBubble : styles.userBubble}`}>
                                <FormattedText text={msg.content} />
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className={styles.msgRow}>
                            <div className={`${styles.msgAvatar} ${styles.aiAvatar}`}>⛓</div>
                            <div className={`${styles.bubble} ${styles.aiBubble}`}>
                                <div className={styles.typing}>
                                    <span className={styles.typingDot} />
                                    <span className={styles.typingDot} />
                                    <span className={styles.typingDot} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className={styles.inputBar}>
                    <textarea
                        ref={textareaRef}
                        className={styles.textarea}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe your game idea… (Enter to send, Shift+Enter for newline)"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        className={styles.sendBtn}
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        title="Send message"
                    >
                        ➤
                    </button>
                </div>
            </div>

            {/* ─── Right: Side Panel ────────────────────── */}
            <div className={styles.sidePanel}>

                {/* Design summary */}
                {gameDesign ? (
                    <div className={`${styles.summaryCard} glass`}>
                        <div className={styles.cardTitle}>
                            <span className={styles.cardTitleDot} />
                            Game Design
                        </div>
                        <div className={styles.designGrid}>
                            <div className={`${styles.designItem} ${styles.fullWidth}`}>
                                <div className={styles.designKey}>Name</div>
                                <div className={styles.designValue} style={{ fontSize: "1rem", fontWeight: 700 }}>
                                    {gameDesign.name}
                                </div>
                            </div>
                            <div className={styles.designItem}>
                                <div className={styles.designKey}>Genre</div>
                                <div className={styles.designValue}>
                                    <span className="badge badge-purple">{gameDesign.genre}</span>
                                </div>
                            </div>
                            <div className={styles.designItem}>
                                <div className={styles.designKey}>Players</div>
                                <div className={styles.designValue}>
                                    <span className="badge badge-teal">👥 Max {gameDesign.maxPlayers}</span>
                                </div>
                            </div>
                            <div className={`${styles.designItem} ${styles.fullWidth}`}>
                                <div className={styles.designKey}>Description</div>
                                <div className={styles.designValue}>{gameDesign.description}</div>
                            </div>
                            {gameDesign.winCondition && (
                                <div className={`${styles.designItem} ${styles.fullWidth}`}>
                                    <div className={styles.designKey}>Win Condition</div>
                                    <div className={styles.designValue}>🏆 {gameDesign.winCondition}</div>
                                </div>
                            )}
                            {gameDesign.rules?.length > 0 && (
                                <div className={`${styles.designItem} ${styles.fullWidth}`}>
                                    <div className={styles.designKey}>Rules</div>
                                    <ul style={{ paddingLeft: "16px", margin: 0 }}>
                                        {gameDesign.rules.map((r, i) => (
                                            <li key={i} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>{r}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={`${styles.summaryCard} glass`}>
                        <div className={styles.cardTitle}>
                            <span className={styles.cardTitleDot} />
                            Game Design
                        </div>
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>💬</div>
                            <p className={styles.emptyText}>
                                Start the conversation<br />
                                Your game design will appear here as you chat with the AI.
                            </p>
                        </div>
                    </div>
                )}

                {/* Game Preview */}
                {gameCode && (
                    <div className={`${styles.previewCard} glass`}>
                        <div className={styles.cardTitle}>
                            <span className={styles.cardTitleDot} style={{ background: "#34d399" }} />
                            Live Preview
                            <span className="badge badge-green" style={{ marginLeft: "auto" }}>✓ Generated</span>
                        </div>
                        <GamePreview code={gameCode} gameId={sessionId || "preview"} />
                    </div>
                )}

                {/* Mint card */}
                {currentPhase === "DEPLOYING" && gameCode && !mintResult && (
                    <div className={`${styles.mintCard} glass`}>
                        <div className={styles.mintHeader}>
                            <div className={styles.mintTitle}>🖼️ Mint as NFT</div>
                            <span className={styles.mintBadge}>ERC-721</span>
                        </div>
                        <div className={styles.mintFeeRow}>
                            <span className={styles.mintFeeLabel}>Mint fee</span>
                            <span className={styles.mintFeeValue}>0.0001 MON</span>
                        </div>
                        <button
                            className={`btn-primary ${styles.mintBtn}`}
                            onClick={handleMint}
                            disabled={isMinting}
                        >
                            {isMinting ? (
                                "⟳ Deploying to Monad…"
                            ) : isConnected ? (
                                "🚀 Deploy & Mint NFT"
                            ) : (
                                "🦊 Connect Wallet to Mint"
                            )}
                        </button>
                    </div>
                )}

                {/* Mint success */}
                {mintResult && (
                    <div className={`${styles.mintedCard} glass`}>
                        <div className={styles.mintedIcon}>🎉</div>
                        <div className={styles.mintedTitle}>Game Deployed!</div>
                        <p className={styles.mintedSub}>
                            Your game NFT #{mintResult.tokenId} is live on Monad
                        </p>
                        <a
                            href={mintResult.explorerUrl || "https://testnet.monadexplorer.com"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.txLink}
                        >
                            ↗ View on Explorer
                        </a>
                        {mintResult.demo && (
                            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "12px", textAlign: "center" }}>
                                Demo mode: Add DEPLOYER_PRIVATE_KEY for real on-chain minting
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function FormattedText({ text }: { text: string }) {
    const lines = text.split("\n");
    return (
        <div>
            {lines.map((line, i) => {
                const html = line
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(/\*(.*?)\*/g, "<em>$1</em>")
                    .replace(/`(.*?)`/g, "<code style='background:rgba(255,255,255,0.08);padding:1px 6px;border-radius:4px;font-family:monospace;font-size:0.85em'>$1</code>");
                return (
                    <span key={i}>
                        <span dangerouslySetInnerHTML={{ __html: html }} />
                        {i < lines.length - 1 && <br />}
                    </span>
                );
            })}
        </div>
    );
}
