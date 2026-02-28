import type { Metadata } from "next";
import { Web3Provider } from "@/lib/Web3Context";
import { QueryProvider } from "@/lib/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
    title: "ChainCraft on Monad — AI Game Builder",
    description: "Create any game through an AI conversation, then mint it as an NFT on Monad blockchain. Real-time multiplayer, zero-cost deployment.",
    keywords: "AI game builder, Monad blockchain, NFT games, multiplayer, Web3",
    openGraph: {
        title: "ChainCraft — Build Games with AI, Deploy on Monad",
        description: "Conversational AI game design + instant NFT minting on Monad testnet.",
        type: "website",
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body>
                <Web3Provider>
                    <QueryProvider>
                        {children}
                    </QueryProvider>
                </Web3Provider>
            </body>
        </html>
    );
}
