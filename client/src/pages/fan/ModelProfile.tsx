import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  MessageCircle, 
  UserPlus, 
  UserCheck, 
  Lock, 
  Gem,
  Heart,
  Bookmark
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { User, Post } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { cn } from '@/lib/utils';

interface ModelProfileProps {
  modelId: string;
}

export default function ModelProfile({ modelId }: ModelProfileProps) {
  const [, setLocation] = useLocation();
  const [showChat, setShowChat] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: model, isLoading: modelLoading } = useQuery({
    queryKey: ['/api/users', modelId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${modelId}`, {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load model');
      return response.json();
    },
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['/api/posts/model', modelId],
    queryFn: async () => {
      const response = await fetch(`/api/posts/model/${modelId}`, {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load posts');
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

  const followMutation = useMutation({
    mutationFn: async (isFollowing: boolean) => {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/follow/${modelId}`, {
        method,
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to update follow status');
      return response.json();
    },
    onSuccess: (_, isFollowing) => {
      queryClient.invalidateQueries({ queryKey: ['/api/following'] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing ? "You unfollowed this model" : "You are now following this model",
      });
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
      queryClient.invalidateQueries({ queryKey: ['/api/posts/model', modelId] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/posts/model', modelId] });
      toast({
        title: "Post saved",
        description: "Added to your saved posts",
      });
    },
  });

  const isFollowing = followedModels.some((followedModel: User) => followedModel.id === modelId);

  const handleFollow = () => {
    followMutation.mutate(isFollowing);
  };

  const handleLikePost = (postId: string, isLiked: boolean) => {
    likeMutation.mutate({ postId, isLiked });
  };

  const handleSavePost = (postId: string, isSaved: boolean) => {
    saveMutation.mutate({ postId, isSaved });
  };

  const handleUnlockPost = (postId: string, gemCost: number) => {
    toast({
      title: "Premium content",
      description: `This feature requires ${gemCost} gems to unlock`,
    });
  };

  if (modelLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Model not found</h2>
          <p className="text-muted-foreground mb-4">The model you're looking for doesn't exist.</p>
          <Link href="/discover">
            <Button>Discover Other Models</Button>
          </Link>
        </div>
      </div>
    );
  }

  const freePosts = posts.filter((post: Post) => !post.isPremium);
  const premiumPosts = posts.filter((post: Post) => post.isPremium);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button
              variant="ghost"
              onClick={() => setLocation('/discover')}
              className="mr-4"
              data-testid="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground" data-testid="page-title">
              {model.username}
            </h1>
          </div>
        </div>
      </header>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <Avatar className="w-32 h-32">
                <AvatarImage src={model.profileImage || undefined} />
                <AvatarFallback className="text-4xl">
                  {model.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="model-username">
                  {model.username}
                </h1>
                
                {model.bio && (
                  <p className="text-muted-foreground mb-4" data-testid="model-bio">
                    {model.bio}
                  </p>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Button
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                    className={cn(
                      "font-semibold",
                      isFollowing
                        ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                        : "theme-gradient text-white"
                    )}
                    data-testid="follow-button"
                  >
                    {followMutation.isPending ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : isFollowing ? (
                      <UserCheck className="w-4 h-4 mr-2" />
                    ) : (
                      <UserPlus className="w-4 h-4 mr-2" />
                    )}
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  
                  <Button
                    onClick={() => setShowChat(true)}
                    variant="outline"
                    data-testid="chat-button"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts Tabs */}
        <Tabs defaultValue="free" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="free" data-testid="free-posts-tab">
              Free Posts ({freePosts.length})
            </TabsTrigger>
            <TabsTrigger value="premium" data-testid="premium-posts-tab">
              Premium Posts ({premiumPosts.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="free" className="mt-6">
            {postsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : freePosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No free posts available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="free-posts-grid">
                {freePosts.map((post: Post) => (
                  <Card key={post.id} className="overflow-hidden card-hover" data-testid={`post-${post.id}`}>
                    {post.media && post.media.length > 0 && (
                      <img
                        src={post.media[0]}
                        alt="Post content"
                        className="w-full h-48 object-cover"
                        data-testid="post-image"
                      />
                    )}
                    
                    <CardContent className="p-4">
                      {post.content && (
                        <p className="text-sm text-muted-foreground mb-3" data-testid="post-content">
                          {post.content}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleLikePost(post.id, false)}
                            className="text-muted-foreground hover:text-red-500"
                            data-testid="like-button"
                          >
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSavePost(post.id, false)}
                            className="text-muted-foreground hover:text-foreground"
                            data-testid="save-button"
                          >
                            <Bookmark className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground" data-testid="post-likes">
                          {post.likes} likes
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="premium" className="mt-6">
            {postsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : premiumPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No premium posts available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="premium-posts-grid">
                {premiumPosts.map((post: Post) => (
                  <Card key={post.id} className="overflow-hidden card-hover" data-testid={`premium-post-${post.id}`}>
                    <div className="relative">
                      {post.media && post.media.length > 0 ? (
                        <img
                          src={post.media[0]}
                          alt="Premium post content"
                          className="w-full h-48 object-cover blur-sm"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 blur-sm"></div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Lock className="w-8 h-8 mx-auto mb-2" />
                          <p className="text-sm font-medium mb-2">Premium Content</p>
                          <Button
                            onClick={() => handleUnlockPost(post.id, post.gemCost || 0)}
                            className="gem-gradient text-white text-xs px-3 py-1"
                            data-testid="unlock-button"
                          >
                            <Gem className="w-3 h-3 mr-1" />
                            {post.gemCost} gems
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      {post.content && (
                        <p className="text-sm text-muted-foreground" data-testid="premium-post-content">
                          {post.content}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat Interface */}
      {showChat && (
        <ChatInterface
          recipient={model}
          onClose={() => setShowChat(false)}
          onMinimize={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
