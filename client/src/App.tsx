import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import FanDashboard from "@/pages/fan/FanDashboard";
import DiscoverModels from "@/pages/fan/DiscoverModels";
import ModelProfile from "@/pages/fan/ModelProfile";
import ModelDashboard from "@/pages/model/ModelDashboard";
import CreatePost from "@/pages/model/CreatePost";
import ManagePosts from "@/pages/model/ManagePosts";
import WorkerDashboard from "@/pages/worker/WorkerDashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import GemPurchase from "@/pages/GemPurchase";

function LoadingScreen() {
  return (
    <div className="fixed inset-0 theme-gradient flex items-center justify-center z-50">
      <div className="text-center text-white">
        <div className="mb-8">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl animate-pulse">💎</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">FanConnect</h1>
          <p className="text-lg opacity-90">Connecting hearts worldwide</p>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Login />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <NotFound />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      
      {/* Fan routes */}
      <Route path="/">
        <ProtectedRoute allowedRoles={['fan']}>
          <FanDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/discover">
        <ProtectedRoute allowedRoles={['fan']}>
          <DiscoverModels />
        </ProtectedRoute>
      </Route>
      
      <Route path="/model/:modelId">
        {({ modelId }) => (
          <ProtectedRoute allowedRoles={['fan']}>
            <ModelProfile modelId={modelId} />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/gems/purchase">
        <ProtectedRoute allowedRoles={['fan']}>
          <GemPurchase />
        </ProtectedRoute>
      </Route>

      {/* Model routes */}
      <Route path="/model">
        <ProtectedRoute allowedRoles={['model']}>
          <ModelDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/model/create">
        <ProtectedRoute allowedRoles={['model']}>
          <CreatePost />
        </ProtectedRoute>
      </Route>
      
      <Route path="/model/posts">
        <ProtectedRoute allowedRoles={['model']}>
          <ManagePosts />
        </ProtectedRoute>
      </Route>

      {/* Worker routes */}
      <Route path="/worker">
        <ProtectedRoute allowedRoles={['worker']}>
          <WorkerDashboard />
        </ProtectedRoute>
      </Route>

      {/* Admin routes */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
