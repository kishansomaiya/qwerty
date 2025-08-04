import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { PlusCircle, Users, DollarSign, Image, MessageSquare, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ModelDashboard() {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/model/stats'],
    queryFn: async () => {
      // Mock stats for now - in real app this would be an API call
      return {
        totalFollowers: 2847,
        monthlyEarnings: 3247,
        totalPosts: 142,
        unreadMessages: 23,
        todayViews: 1250,
        thisWeekLikes: 456
      };
    },
  });

  const { data: recentPosts = [] } = useQuery({
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
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
              Welcome back, {user?.username}! ✨
            </h2>
            <p className="text-muted-foreground">
              Here's what's happening with your profile today.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Followers</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="total-followers">
                      {stats?.totalFollowers?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Earnings</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="monthly-earnings">
                      ${stats?.monthlyEarnings?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Posts</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="total-posts">
                      {stats?.totalPosts || '0'}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-xl">
                    <Image className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unread Messages</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="unread-messages">
                      {stats?.unreadMessages || '0'}
                    </p>
                  </div>
                  <div className="bg-pink-100 dark:bg-pink-900 p-3 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/model/create">
                  <Button className="w-full h-16 theme-gradient text-white font-semibold text-lg btn-hover-scale" data-testid="create-post-button">
                    <PlusCircle className="w-6 h-6 mr-3" />
                    Create New Post
                  </Button>
                </Link>
                
                <Button variant="outline" className="w-full h-16 font-semibold text-lg btn-hover-scale" data-testid="view-analytics-button">
                  <TrendingUp className="w-6 h-6 mr-3" />
                  View Analytics
                </Button>
                
                <Button variant="outline" className="w-full h-16 font-semibold text-lg btn-hover-scale" data-testid="check-messages-button">
                  <MessageSquare className="w-6 h-6 mr-3" />
                  Check Messages
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Posts
                  <Link href="/model/posts">
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No posts yet</p>
                    <Link href="/model/create">
                      <Button variant="outline" size="sm" className="mt-2">
                        Create your first post
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="recent-posts">
                    {recentPosts.slice(0, 3).map((post: any) => (
                      <div key={post.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                          <Image className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{post.title || 'Untitled Post'}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{post.likes} likes</p>
                          {post.isPremium && (
                            <span className="text-xs text-yellow-600 dark:text-yellow-400">Premium</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>This Week's Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="performance-metrics">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Profile Views</span>
                    <span className="font-semibold">{stats?.todayViews?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Likes</span>
                    <span className="font-semibold">{stats?.thisWeekLikes?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">New Followers</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">+47</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Engagement Rate</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">8.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Theme Selector */}
      <ThemeSelector
        isOpen={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </div>
  );
}
