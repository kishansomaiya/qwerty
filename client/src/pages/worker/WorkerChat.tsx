
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle } from 'lucide-react';
import { authService } from '@/lib/auth';
import { User } from '@shared/schema';

export function WorkerChat() {
  const [activeChats, setActiveChats] = useState<Map<string, User>>(new Map());

  const { data: assignedModels } = useQuery({
    queryKey: ['/api/worker/assignments'],
    queryFn: async () => {
      const response = await fetch('/api/worker/assignments', {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load assignments');
      return response.json();
    },
  });

  const { data: conversations } = useQuery({
    queryKey: ['/api/worker/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/worker/conversations', {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load conversations');
      return response.json();
    },
  });

  const openChat = (user: User) => {
    setActiveChats(prev => new Map(prev.set(user.id, user)));
  };

  const closeChat = (userId: string) => {
    setActiveChats(prev => {
      const newChats = new Map(prev);
      newChats.delete(userId);
      return newChats;
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversations?.map((conversation: any) => (
              <div key={conversation.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={conversation.fan.profileImage} />
                    <AvatarFallback>{conversation.fan.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{conversation.fan.username}</p>
                    <p className="text-sm text-gray-500">
                      Chatting as: {conversation.model.username}
                    </p>
                  </div>
                </div>
                <Button onClick={() => openChat(conversation.fan)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open Chat
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {Array.from(activeChats.entries()).map(([userId, user]) => (
        <ChatInterface
          key={userId}
          recipient={user}
          onClose={() => closeChat(userId)}
          onMinimize={() => closeChat(userId)}
        />
      ))}
    </div>
  );
}
