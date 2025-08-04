import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, MessageCircle, UserPlus, UserCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

export default function DiscoverModels() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['/api/users/models'],
    queryFn: async () => {
      const response = await fetch('/api/users/models', {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load models');
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
    mutationFn: async ({ modelId, isFollowing }: { modelId: string; isFollowing: boolean }) => {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/follow/${modelId}`, {
        method,
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to update follow status');
      return response.json();
    },
    onSuccess: (_, { isFollowing }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/following'] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing ? "You unfollowed this model" : "You are now following this model",
      });
    },
  });

  const filteredModels = models.filter((model: User) =>
    model.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFollowing = (modelId: string) =>
    followedModels.some((model: User) => model.id === modelId);

  const handleFollow = (modelId: string) => {
    const following = isFollowing(modelId);
    followMutation.mutate({ modelId, isFollowing: following });
  };

  const handleChat = (modelId: string) => {
    // Navigate to chat or open chat interface
    toast({
      title: "Chat feature",
      description: "Opening chat with model...",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/')}
                data-testid="back-button"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold text-foreground" data-testid="page-title">
                Discover Models
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                  data-testid="search-input"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredModels.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No models found</h3>
              <p>Try adjusting your search terms</p>
            </div>
          </div>
        ) : (
          <div className="models-grid" data-testid="models-grid">
            {filteredModels.map((model: User) => {
              const following = isFollowing(model.id);
              
              return (
                <Card
                  key={model.id}
                  className="overflow-hidden card-hover cursor-pointer"
                  data-testid={`model-card-${model.id}`}
                >
                  <Link href={`/model/${model.id}`}>
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={model.profileImage || undefined} />
                        <AvatarFallback className="text-2xl">
                          {model.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </Link>
                  
                  <CardContent className="p-4">
                    <Link href={`/model/${model.id}`}>
                      <h3 className="font-semibold text-foreground mb-1 hover:text-primary transition-colors" data-testid="model-name">
                        {model.username}
                      </h3>
                    </Link>
                    
                    {model.bio && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid="model-bio">
                        {model.bio}
                      </p>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleFollow(model.id)}
                        disabled={followMutation.isPending}
                        className={cn(
                          "flex-1 font-semibold transition-all",
                          following
                            ? "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                            : "theme-gradient text-white"
                        )}
                        data-testid={`follow-button-${model.id}`}
                      >
                        {followMutation.isPending ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : following ? (
                          <UserCheck className="w-4 h-4 mr-2" />
                        ) : (
                          <UserPlus className="w-4 h-4 mr-2" />
                        )}
                        {following ? 'Following' : 'Follow'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleChat(model.id)}
                        data-testid={`chat-button-${model.id}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
