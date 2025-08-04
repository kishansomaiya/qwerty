import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, Lock, Gem } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { Post, User } from '@shared/schema';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function FanDashboard() {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [chatRecipient, setChatRecipient] = useState<User | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: feedPosts = [] } = useQuery({
    queryKey: ['/api/posts/feed'],
    queryFn: async () => {
      const response = await fetch('/api/posts/feed', {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load feed');
      return response.json();
    },
  });

  const { data: followedModels = [] } = useQuery({
    queryKey: ['/api/following'],
    queryFn: async () => {
      const response = await fetch('/api/following', {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load followed models');
      return response.json();
    },
  });

  const likeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${postId}/like`, {
        method,
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to like post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch(`/api/posts/${postId}/save`, {
        method,
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to save post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/feed'] });
      toast({
        title: "Post saved",
        description: "Added to your saved posts",
      });
    },
  });

  const handleLikePost = (postId: string, isLiked: boolean) => {
    likeMutation.mutate({ postId, isLiked });
  };

  const handleSavePost = (postId: string, isSaved: boolean) => {
    saveMutation.mutate({ postId, isSaved });
  };

  const openChat = (model: User) => {
    setChatRecipient(model);
  };

  const closeChat = () => {
    setChatRecipient(null);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar onThemeClick={() => setShowThemeSelector(true)} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">


          {/* Posts Feed */}
          <div className="space-y-6" data-testid="posts-feed">
            {feedPosts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="text-muted-foreground">
                    <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No posts in your feed</h3>
                    <p className="mb-4">Follow some models to see their content here</p>
                    <Link href="/discover">
                      <Button className="theme-gradient">
                        Discover Models
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              feedPosts.map((post: Post) => (
                <Card key={post.id} className="overflow-hidden card-hover" data-testid={`post-${post.id}`}>
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>M</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground" data-testid="post-author">
                          Model {post.modelId.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Post Content */}
                  {post.isPremium && (post.gemCost || 0) > 0 ? (
                    <div className="relative">
                      <div className="h-96 bg-gray-200 blur-sm"></div>
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Lock className="w-12 h-12 mx-auto mb-4" />
                          <h4 className="text-xl font-semibold mb-2">Premium Content</h4>
                          <p className="mb-4">Unlock with {post.gemCost} gems</p>
                          <Button className="gem-gradient text-white font-semibold">
                            <Gem className="w-4 h-4 mr-2" />
                            Unlock Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    post.media && post.media.length > 0 && (
                      <img
                        src={post.media[0]}
                        alt="Post content"
                        className="w-full h-96 object-cover"
                        data-testid="post-image"
                      />
                    )
                  )}

                  {/* Post Actions */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikePost(post.id, false)}
                          className="text-muted-foreground hover:text-red-500 btn-hover-scale"
                          data-testid="like-post"
                        >
                          <Heart className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-primary btn-hover-scale"
                          data-testid="comment-post"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSavePost(post.id, false)}
                          className="text-muted-foreground hover:text-foreground btn-hover-scale"
                          data-testid="save-post"
                        >
                          <Bookmark className="w-5 h-5" />
                        </Button>
                      </div>
                      <span className="text-sm text-muted-foreground" data-testid="post-likes">
                        {post.likes} likes
                      </span>
                    </div>
                    
                    {post.content && (
                      <p className="text-foreground" data-testid="post-content">
                        <span className="font-semibold">Model</span> {post.content}
                      </p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-card border-l border-border overflow-y-auto">
        {/* Gems Section */}
        <div className="p-4 border-b border-border">
          <Card className="gem-gradient text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Your Gems</h3>
                <Gem className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold mb-3" data-testid="user-gems">
                {user?.gems || 0}
              </div>
              <Link href="/gems/purchase">
                <Button className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold" data-testid="buy-gems">
                  Buy More Gems
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Following Section */}
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Following</h3>
          <div className="space-y-3">
            {followedModels.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p className="mb-4">You're not following anyone yet</p>
                <Link href="/discover">
                  <Button variant="outline" size="sm">
                    Discover Models
                  </Button>
                </Link>
              </div>
            ) : (
              followedModels.map((model: User) => (
                <div key={model.id} className="flex items-center justify-between" data-testid={`following-${model.id}`}>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={model.profileImage || undefined} />
                      <AvatarFallback>{model.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground" data-testid="model-name">
                        {model.username}
                      </p>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Online</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => openChat(model)}
                    className="theme-gradient btn-hover-scale"
                    data-testid={`chat-${model.id}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />

      {chatRecipient && (
        <ChatInterface
          recipient={chatRecipient}
          onClose={closeChat}
          onMinimize={closeChat}
        />
      )}
    </div>
  );
}
