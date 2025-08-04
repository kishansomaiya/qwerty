import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Minimize2, X, Send, Gem } from 'lucide-react';
import { Message, User } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  recipient: User;
  onClose: () => void;
  onMinimize: () => void;
  className?: string;
}

export function ChatInterface({ recipient, onClose, onMinimize, className }: ChatInterfaceProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { sendMessage, onNewMessage, offNewMessage } = useWebSocket();

  const { data: chatMessages } = useQuery({
    queryKey: ['/api/messages', recipient.id],
    queryFn: async () => {
      const response = await fetch(`/api/messages/${recipient.id}`, {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load messages');
      return response.json();
    },
  });

  useEffect(() => {
    if (chatMessages) {
      setMessages(chatMessages);
    }
  }, [chatMessages]);

  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      if (newMessage.senderId === recipient.id || newMessage.receiverId === recipient.id) {
        setMessages(prev => [...prev, newMessage]);
      }
    };

    onNewMessage(handleNewMessage);
    return () => offNewMessage(handleNewMessage);
  }, [recipient.id, onNewMessage, offNewMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      // Check if user has enough gems (for fans)
      if (user.role === 'fan' && (user.gems || 0) < 1) {
        // Handle insufficient gems
        return;
      }

      sendMessage(recipient.id, message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-80 h-96 flex flex-col animate-slide-up z-40",
      className
    )} data-testid="chat-interface">
      {/* Header */}
      <div className="p-4 theme-gradient rounded-t-lg text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src={recipient.profileImage || undefined} />
              <AvatarFallback>{recipient.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold text-sm" data-testid="chat-recipient-name">
                {recipient.username}
              </h4>
              <div className="flex items-center space-x-1 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="text-white hover:bg-white/20"
              data-testid="minimize-chat"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
              data-testid="close-chat"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3" data-testid="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-start space-x-2",
              msg.senderId === user?.id ? "justify-end" : ""
            )}
            data-testid={`message-${index}`}
          >
            {msg.senderId !== user?.id && (
              <Avatar className="w-6 h-6 flex-shrink-0">
                <AvatarImage src={recipient.profileImage || undefined} />
                <AvatarFallback className="text-xs">
                  {recipient.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "chat-bubble rounded-2xl p-3 max-w-xs",
                msg.senderId === user?.id
                  ? "theme-gradient text-white rounded-tr-sm"
                  : "bg-gray-100 text-gray-900 rounded-tl-sm"
              )}
            >
              <p className="text-sm" data-testid="message-content">{msg.content}</p>
              <span className={cn(
                "text-xs",
                msg.senderId === user?.id ? "text-white/80" : "text-gray-500"
              )}>
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 'Unknown time'}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            data-testid="message-input"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="theme-gradient"
            data-testid="send-message"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {user?.role === 'fan' && (
          <p className="text-xs text-gray-500 mt-2 text-center flex items-center justify-center">
            <Gem className="w-3 h-3 text-yellow-500 mr-1" />
            1 gem per message
          </p>
        )}
      </div>
    </Card>
  );
}
