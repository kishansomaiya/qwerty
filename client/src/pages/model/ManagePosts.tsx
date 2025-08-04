import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Heart, 
  MessageCircle,
  Gem,
  Plus
} from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { Post } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ManagePosts() {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'free' | 'premium'>('all');
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['/api/posts/model', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/posts/model/${user?.id}`, {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load posts');
      return response.json();
    },
    enabled: !!user?.id,
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/model', user?.id] });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      });
      setDeletePostId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete post",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredPosts = posts.filter((post: Post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'premium' && post.isPremium) ||
                         (filterType === 'free' && !post.isPremium);
    
    return matchesSearch && matchesFilter;
  });

  const handleDeletePost = (postId: string) => {
    setDeletePostId(postId);
  };

  const confirmDelete = () => {
    if (deletePostId) {
      deletePostMutation.mutate(deletePostId);
    }
  };

  if (isLoading) {
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="page-title">
                Manage Posts
              </h1>
              <p className="text-muted-foreground">
                View and manage all your posts
              </p>
            </div>
            <Link href="/model/create">
              <Button className="theme-gradient text-white font-semibold mt-4 sm:mt-0" data-testid="create-post-button">
                <Plus className="w-4 h-4 mr-2" />
                Create Post
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-posts"
              />
            </div>
            
            <div className="flex gap-2">
              {(['all', 'free', 'premium'] as const).map((type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  onClick={() => setFilterType(type)}
                  className="capitalize"
                  data-testid={`filter-${type}`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{posts.length}</div>
                <div className="text-sm text-muted-foreground">Total Posts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {posts.filter((p: Post) => !p.isPremium).length}
                </div>
                <div className="text-sm text-muted-foreground">Free Posts</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {posts.filter((p: Post) => p.isPremium).length}
                </div>
                <div className="text-sm text-muted-foreground">Premium Posts</div>
              </CardContent>
            </Card>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-muted-foreground">
                  <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    {posts.length === 0 ? 'No posts yet' : 'No posts match your filters'}
                  </h3>
                  <p className="mb-4">
                    {posts.length === 0 
                      ? 'Create your first post to get started'
                      : 'Try adjusting your search or filter criteria'
                    }
                  </p>
                  {posts.length === 0 && (
                    <Link href="/model/create">
                      <Button className="theme-gradient">
                        Create Your First Post
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="posts-grid">
              {filteredPosts.map((post: Post) => (
                <Card key={post.id} className="overflow-hidden card-hover" data-testid={`post-card-${post.id}`}>
                  {/* Post Image/Placeholder */}
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center relative">
                    {post.media && post.media.length > 0 ? (
                      <img
                        src={post.media[0]}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted-foreground">
                        <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No media</p>
                      </div>
                    )}
                    
                    {post.isPremium && (
                      <Badge className="absolute top-2 left-2 gem-gradient text-white">
                        <Gem className="w-3 h-3 mr-1" />
                        {post.gemCost} gems
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate" data-testid="post-title">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" data-testid="post-menu">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem data-testid="edit-post">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeletePost(post.id)}
                            className="text-destructive"
                            data-testid="delete-post"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {post.content && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid="post-content">
                        {post.content}
                      </p>
                    )}

                    {/* Post Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          <span data-testid="post-likes">{post.likes}</span>
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          <span>0</span>
                        </div>
                      </div>
                      
                      <Badge variant={post.isPremium ? "secondary" : "outline"}>
                        {post.isPremium ? 'Premium' : 'Free'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deletePostMutation.isPending}
              className="bg-destructive hover:bg-destructive/80"
              data-testid="confirm-delete"
            >
              {deletePostMutation.isPending && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Theme Selector */}
      <ThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </div>
  );
}
