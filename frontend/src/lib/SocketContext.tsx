"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    joinGame: (gameId: string, walletAddress: string) => void;
    leaveGame: (gameId: string) => void;
    sendAction: (gameId: string, action: any) => void;
    sendChat: (gameId: string, message: string) => void;
    reportGameOver: (gameId: string, score: number) => void;
    onPlayerJoined: (handler: (data: any) => void) => () => void;
    onPlayerLeft: (handler: (data: any) => void) => () => void;
    onActionBroadcast: (handler: (data: any) => void) => () => void;
    onChatBroadcast: (handler: (data: any) => void) => () => void;
    onGameState: (handler: (data: any) => void) => () => void;
    onPlayerFinished: (handler: (data: any) => void) => () => void;
}

const SocketContext = createContext<SocketContextType>({} as SocketContextType);

export function SocketProvider({ children }: { children: ReactNode }) {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
        const socket = io(BACKEND, {
            transports: ["websocket", "polling"],
            autoConnect: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => setIsConnected(true));
        socket.on("disconnect", () => setIsConnected(false));

        return () => { socket.disconnect(); };
    }, []);

    const joinGame = useCallback((gameId: string, walletAddress: string) => {
        socketRef.current?.emit("join_game", { gameId, walletAddress });
    }, []);

    const leaveGame = useCallback((gameId: string) => {
        socketRef.current?.emit("leave_game", { gameId });
    }, []);

    const sendAction = useCallback((gameId: string, action: any) => {
        socketRef.current?.emit("game_action", { gameId, action });
    }, []);

    const sendChat = useCallback((gameId: string, message: string) => {
        socketRef.current?.emit("chat_message", { gameId, message });
    }, []);

    const reportGameOver = useCallback((gameId: string, score: number) => {
        socketRef.current?.emit("game_over", { gameId, score });
    }, []);

    const makeHandler = (event: string) => (handler: (d: any) => void) => {
        socketRef.current?.on(event, handler);
        return () => { socketRef.current?.off(event, handler); };
    };

    return (
        <SocketContext.Provider value={{
            socket: socketRef.current,
            isConnected,
            joinGame,
            leaveGame,
            sendAction,
            sendChat,
            reportGameOver,
            onPlayerJoined: makeHandler("player_joined"),
            onPlayerLeft: makeHandler("player_left"),
            onActionBroadcast: makeHandler("action_broadcast"),
            onChatBroadcast: makeHandler("chat_broadcast"),
            onGameState: makeHandler("game_state"),
            onPlayerFinished: makeHandler("player_finished"),
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);
