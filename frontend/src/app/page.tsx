"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { ChatBuilder } from "@/components/ChatBuilder";
import { GameBrowser } from "@/components/GameBrowser";
import { Leaderboard } from "@/components/Leaderboard";

type Tab = "create" | "browse" | "leaderboard";

export default function Home() {
    const [activeTab, setActiveTab] = useState<Tab>("create");
    const [showChat, setShowChat] = useState(false);

    const handleStart = () => {
        setShowChat(true);
        setActiveTab("create");
    };

    return (
        <>
            <Navbar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); }} />

            <main>
                {/* CREATE tab */}
                {activeTab === "create" && (
                    showChat ? (
                        <div className="page-container" style={{ paddingTop: "32px", paddingBottom: "32px" }}>
                            <ChatBuilder />
                        </div>
                    ) : (
                        <HeroSection onStart={handleStart} />
                    )
                )}

                {/* BROWSE tab */}
                {activeTab === "browse" && (
                    <div className="page-container">
                        <GameBrowser />
                    </div>
                )}

                {/* LEADERBOARD tab */}
                {activeTab === "leaderboard" && (
                    <div className="page-container">
                        <Leaderboard />
                    </div>
                )}
            </main>
        </>
    );
}
