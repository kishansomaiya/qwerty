import { createContext, useContext, useEffect, useState } from "react";
import { Message } from "@shared/schema";
import { wsService } from "@/lib/websocket";
import { useAuth } from "./AuthContext";

interface WebSocketContextType {
  connected: boolean;
  sendMessage: (receiverId: string, content: string) => void;
  onNewMessage: (handler: (message: Message) => void) => void;
  offNewMessage: (handler: (message: Message) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const handleConnected = () => setConnected(true);
    const handleDisconnected = () => setConnected(false);
    const handleError = (error: any) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    wsService.on('connected', handleConnected);
    wsService.on('disconnected', handleDisconnected);
    wsService.on('error', handleError);

    return () => {
      wsService.off('connected', handleConnected);
      wsService.off('disconnected', handleDisconnected);
      wsService.off('error', handleError);
    };
  }, []);

  const sendMessage = (receiverId: string, content: string) => {
    wsService.sendMessage(receiverId, content);
  };

  const onNewMessage = (handler: (message: Message) => void) => {
    wsService.on('new_message', (data: any) => {
      if (data.message) {
        handler(data.message);
      }
    });
  };

  const offNewMessage = (handler: (message: Message) => void) => {
    wsService.off('new_message', (data: any) => {
      if (data.message) {
        handler(data.message);
      }
    });
  };

  return (
    <WebSocketContext.Provider value={{
      connected,
      sendMessage,
      onNewMessage,
      offNewMessage,
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
