import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { 
  Users, 
  Shield, 
  TrendingUp, 
  DollarSign,
  Search,
  UserCheck,
  UserX,
  Settings,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/lib/auth';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export default function AdminDashboard() {
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [assignmentModal, setAssignmentModal] = useState<{
    workerId: string;
    modelId: string;
  } | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load users');
      return response.json();
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const totalUsers = users.length;
      const fans = users.filter((u: User) => u.role === 'fan').length;
      const models = users.filter((u: User) => u.role === 'model').length;
      const workers = users.filter((u: User) => u.role === 'worker').length;
      
      return {
        totalUsers,
        totalFans: fans,
        totalModels: models,
        totalWorkers: workers,
        monthlyRevenue: 45000,
        activeSubscriptions: 1250
      };
    },
    enabled: users.length > 0,
  });

  const assignWorkerMutation = useMutation({
    mutationFn: async ({ workerId, modelId }: { workerId: string; modelId: string }) => {
      const response = await fetch('/api/admin/assign-worker', {
        method: 'POST',
        headers: {
          ...authService.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workerId, modelId }),
      });
      if (!response.ok) throw new Error('Failed to assign worker');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Worker assigned",
        description: "Worker has been successfully assigned to the model.",
      });
      setAssignmentModal(null);
    },
    onError: (error) => {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
      setDeleteUserId(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const fans = users.filter((u: User) => u.role === 'fan');
  const models = users.filter((u: User) => u.role === 'model');
  const workers = users.filter((u: User) => u.role === 'worker');

  const handleAssignWorker = (workerId: string, modelId: string) => {
    setAssignmentModal({ workerId, modelId });
  };

  const confirmAssignment = () => {
    if (assignmentModal) {
      assignWorkerMutation.mutate(assignmentModal);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setDeleteUserId(userId);
  };

  const confirmDelete = () => {
    if (deleteUserId) {
      deleteUserMutation.mutate(deleteUserId);
    }
  };

  if (usersLoading) {
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
              Admin Dashboard 🛡️
            </h2>
            <p className="text-muted-foreground">
              Manage users, worker assignments, and platform settings.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="total-users">
                      {stats?.totalUsers || '0'}
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
                    <p className="text-sm text-muted-foreground">Total Models</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="total-models">
                      {stats?.totalModels || '0'}
                    </p>
                  </div>
                  <div className="bg-pink-100 dark:bg-pink-900 p-3 rounded-xl">
                    <Shield className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="monthly-revenue">
                      ${stats?.monthlyRevenue?.toLocaleString() || '0'}
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
                    <p className="text-sm text-muted-foreground">Active Subs</p>
                    <p className="text-2xl font-bold text-foreground" data-testid="active-subscriptions">
                      {stats?.activeSubscriptions?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users" data-testid="users-tab">Manage Users</TabsTrigger>
              <TabsTrigger value="assignments" data-testid="assignments-tab">Worker Assignments</TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="search-users"
                  />
                </div>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-48" data-testid="role-filter">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="fan">Fans</SelectItem>
                    <SelectItem value="model">Models</SelectItem>
                    <SelectItem value="worker">Workers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Users ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No users found</p>
                    </div>
                  ) : (
                    <div className="space-y-3" data-testid="users-list">
                      {filteredUsers.map((user: User) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                          data-testid={`user-${user.id}`}
                        >
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src={user.profileImage || undefined} />
                              <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-foreground" data-testid="user-username">
                                  {user.username}
                                </p>
                                <Badge variant={user.isActive ? "default" : "secondary"}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline" className="capitalize">
                                  {user.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground" data-testid="user-email">
                                {user.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown date'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {user.role === 'fan' && (
                              <Badge variant="outline" className="text-yellow-600 dark:text-yellow-400">
                                {user.gems} gems
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              data-testid={`delete-user-${user.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Worker Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Available Workers */}
                    <div>
                      <h3 className="font-semibold mb-4">Available Workers ({workers.length})</h3>
                      <div className="space-y-3" data-testid="workers-list">
                        {workers.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No workers registered</p>
                          </div>
                        ) : (
                          workers.map((worker: User) => (
                            <div
                              key={worker.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              data-testid={`worker-${worker.id}`}
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={worker.profileImage || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {worker.username[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{worker.username}</p>
                                  <p className="text-xs text-muted-foreground">Worker</p>
                                </div>
                              </div>
                              <Badge variant={worker.isActive ? "default" : "secondary"} className="text-xs">
                                {worker.isActive ? 'Available' : 'Inactive'}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Models */}
                    <div>
                      <h3 className="font-semibold mb-4">Models ({models.length})</h3>
                      <div className="space-y-3" data-testid="models-list">
                        {models.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No models registered</p>
                          </div>
                        ) : (
                          models.map((model: User) => (
                            <div
                              key={model.id}
                              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                              data-testid={`model-${model.id}`}
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={model.profileImage || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {model.username[0].toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{model.username}</p>
                                  <p className="text-xs text-muted-foreground">Model</p>
                                </div>
                              </div>
                              {workers.length > 0 && (
                                <Select
                                  onValueChange={(workerId) => handleAssignWorker(workerId, model.id)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue placeholder="Assign" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {workers.map((worker: User) => (
                                      <SelectItem key={worker.id} value={worker.id}>
                                        {worker.username}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Assignment Confirmation Dialog */}
      <AlertDialog open={!!assignmentModal} onOpenChange={() => setAssignmentModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Worker</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign this worker to manage the selected model's chat?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-assignment">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAssignment}
              disabled={assignWorkerMutation.isPending}
              data-testid="confirm-assignment"
            >
              {assignWorkerMutation.isPending && (
                <LoadingSpinner size="sm" className="mr-2" />
              )}
              Assign Worker
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive hover:bg-destructive/80"
              data-testid="confirm-delete"
            >
              {deleteUserMutation.isPending && (
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
