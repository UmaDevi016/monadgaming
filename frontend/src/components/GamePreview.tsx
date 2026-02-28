"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submitScore } from "@/lib/api";
import { useWeb3 } from "@/lib/Web3Context";
import styles from "./GamePreview.module.css";

interface GamePreviewProps {
    code: string;
    gameId: string;
}

export function GamePreview({ code, gameId }: GamePreviewProps) {
    const { address } = useWeb3();
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lastScore, setLastScore] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Listen for GAME_OVER message from iframe
    useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type === "GAME_OVER") {
                const score = Number(event.data.score || 0);
                setLastScore(score);
                setIsPlaying(false);

                // Submit score to backend
                if (address && gameId) {
                    try {
                        await submitScore({
                            walletAddress: address,
                            gameId,
                            score,
                        });
                    } catch (e) {
                        console.warn("Score submission failed:", e);
                    }
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [address, gameId]);

    const blob = new Blob([code], { type: "text/html" });
    const src = URL.createObjectURL(blob);

    const handlePlay = () => {
        setIsPlaying(true);
        setLastScore(null);
    };

    const handleRestart = () => {
        if (iframeRef.current) {
            iframeRef.current.src = src;
            setLastScore(null);
            setIsPlaying(true);
        }
    };

    return (
        <div className={`${styles.wrapper} ${isFullscreen ? styles.fullscreen : ""}`}>
            {/* Iframe game */}
            <div className={styles.iframeWrapper} onClick={handlePlay}>
                <iframe
                    ref={iframeRef}
                    src={src}
                    className={styles.iframe}
                    sandbox="allow-scripts allow-same-origin"
                    title="Game Preview"
                />
                {!isPlaying && (
                    <div className={styles.overlay}>
                        <button className={`${styles.playBtn} btn-primary`}>
                            ▶ Play Game
                        </button>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className={styles.controls}>
                <button className={styles.controlBtn} onClick={handleRestart}>
                    🔄 Restart
                </button>
                <button
                    className={styles.controlBtn}
                    onClick={() => setIsFullscreen(!isFullscreen)}
                >
                    {isFullscreen ? "⊡ Exit" : "⊞ Fullscreen"}
                </button>

                {lastScore !== null && (
                    <div className={styles.scoreDisplay}>
                        🏆 Score: <strong>{lastScore}</strong>
                    </div>
                )}
            </div>
        </div>
    );
}
