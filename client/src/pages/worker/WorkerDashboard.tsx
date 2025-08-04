import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { 
  MessageSquare, 
  Users, 
  Clock, 
  TrendingUp,
  Bell,
  Star
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { User, Message } from '@shared/schema';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { WorkerChat } from './WorkerChat';

export default function WorkerDashboard() {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [chatRecipient, setChatRecipient] = useState<User | null>(null);
  const { user } = useAuth();

  const { data: assignedModels = [], isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/worker/assignments'],
    queryFn: async () => {
      const response = await fetch('/api/worker/assignments', {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load assignments');
      return response.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/worker/stats'],
    queryFn: async () => {
      // Mock stats for now
      return {
        totalMessages: 247,
        todayMessages: 23,
        activeChats: 8,
        responseTime: '2.3 min'
      };
    },
  });

  const { data: recentMessages = [] } = useQuery({
    queryKey: ['/api/worker/recent-messages'],
    queryFn: async () => {
      // Mock recent messages for now
      return [];
    },
  });

  const openChat = (model: User) => {
    setChatRecipient(model);
  };

  const closeChat = () => {
    setChatRecipient(null);
  };

  if (modelsLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar onThemeClick={() => setShowThemeSelector(true)} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar onThemeClick={() => setShowThemeSelector(true)} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2" data-testid="welcome-message">
              Welcome back, {user?.username}! 💬
            </h2>
            <p className="text-muted-foreground">
              Manage your assigned model accounts and chat with fans.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Messages</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="total-messages">
                      {stats?.totalMessages || '0'}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Messages</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="today-messages">
                      {stats?.todayMessages || '0'}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Chats</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="active-chats">
                      {stats?.activeChats || '0'}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="response-time">
                      {stats?.responseTime || '0 min'}
                    </p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Models */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2 text-yellow-500" />
                  Assigned Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedModels.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No models assigned yet</p>
                    <p className="text-sm">Contact your admin to get assignments</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="assigned-models">
                    {assignedModels.map((model: User) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        data-testid={`model-${model.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={model.profileImage || undefined} />
                            <AvatarFallback>{model.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground" data-testid="model-name">
                              {model.username}
                            </p>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-muted-foreground">Online</span>
                              <Badge variant="outline" className="text-xs">
                                3 unread
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => openChat(model)}
                          className="theme-gradient"
                          data-testid={`chat-${model.id}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No recent activity</p>
                    <p className="text-sm">Messages will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="recent-activity">
                    {recentMessages.map((message: Message) => (
                      <div key={message.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">F</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{message.content}</p>
                          <p className="text-xs text-muted-foreground">
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Unknown time'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Tips */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Tips for Success</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Respond Quickly
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Aim to respond to messages within 5 minutes to keep fans engaged
                  </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Stay In Character
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Always chat as if you're the assigned model to maintain authenticity
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    Be Engaging
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Ask questions and show interest in the fan's messages
                  </p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    Report Issues
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Contact admin immediately if you encounter inappropriate content
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <WorkerChat />
      </div>
    </div>
  );
}