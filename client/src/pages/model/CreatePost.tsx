import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { FileUpload } from '@/components/ui/file-upload';
import { ArrowLeft, Upload, Gem } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CreatePost() {
  const [, setLocation] = useLocation();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isPremium: false,
    gemCost: 0,
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: authService.getAuthHeaders(),
        body: data,
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts/model'] });
      toast({
        title: "Post created!",
        description: "Your post has been published successfully.",
      });
      setLocation('/model/posts');
    },
    onError: (error) => {
      toast({
        title: "Failed to create post",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your post.",
        variant: "destructive",
      });
      return;
    }

    if (formData.isPremium && formData.gemCost < 1) {
      toast({
        title: "Gem cost required",
        description: "Premium posts must have a gem cost of at least 1.",
        variant: "destructive",
      });
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('content', formData.content);
    data.append('isPremium', formData.isPremium.toString());
    data.append('gemCost', formData.gemCost.toString());
    
    files.forEach((file) => {
      data.append('media', file);
    });

    createPostMutation.mutate(data);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar onThemeClick={() => setShowThemeSelector(true)} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Link href="/model">
              <Button variant="ghost" className="mr-4" data-testid="back-button">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">
              Create New Post
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Post Details */}
            <Card>
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter post title..."
                    required
                    data-testid="post-title-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Caption</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Write a caption for your post..."
                    rows={4}
                    data-testid="post-content-input"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Media Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  Media Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesChange={setFiles}
                  maxFiles={5}
                  accept="image/*,video/*"
                />
              </CardContent>
            </Card>

            {/* Premium Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gem className="w-5 h-5 mr-2 text-yellow-500" />
                  Premium Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="isPremium">Make this a premium post</Label>
                    <p className="text-sm text-muted-foreground">
                      Premium posts require gems to view
                    </p>
                  </div>
                  <Switch
                    id="isPremium"
                    checked={formData.isPremium}
                    onCheckedChange={(checked) => handleInputChange('isPremium', checked)}
                    data-testid="premium-toggle"
                  />
                </div>

                {formData.isPremium && (
                  <div className="space-y-2">
                    <Label htmlFor="gemCost">Gem Cost</Label>
                    <Input
                      id="gemCost"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.gemCost}
                      onChange={(e) => handleInputChange('gemCost', parseInt(e.target.value) || 0)}
                      placeholder="Enter gem cost..."
                      data-testid="gem-cost-input"
                    />
                    <p className="text-sm text-muted-foreground">
                      Fans will need to spend this many gems to view your post
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Link href="/model">
                <Button variant="outline" data-testid="cancel-button">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={createPostMutation.isPending}
                className="theme-gradient text-white font-semibold px-8"
                data-testid="publish-button"
              >
                {createPostMutation.isPending && (
                  <LoadingSpinner size="sm" className="mr-2" />
                )}
                Publish Post
              </Button>
            </div>
          </form>
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
