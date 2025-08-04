import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Home, 
  Search, 
  Bookmark, 
  User, 
  Palette, 
  LogOut, 
  Star,
  PlusCircle,
  Image as ImageIcon,
  Users,
  BarChart,
  MessageSquare,
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onThemeClick: () => void;
  className?: string;
}

export function Sidebar({ onThemeClick, className }: SidebarProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const getNavItems = () => {
    switch (user.role) {
      case 'fan':
        return [
          { href: '/', icon: Home, label: 'Home Feed', exact: true },
          { href: '/discover', icon: Search, label: 'Discover Models' },
          { href: '/saved', icon: Bookmark, label: 'Saved Posts' },
          { href: '/profile', icon: User, label: 'Profile Settings' },
        ];
      case 'model':
        return [
          { href: '/model', icon: Home, label: 'Dashboard', exact: true },
          { href: '/model/create', icon: PlusCircle, label: 'Create Post' },
          { href: '/model/posts', icon: ImageIcon, label: 'My Posts' },
          { href: '/model/followers', icon: Users, label: 'Followers' },
          { href: '/model/analytics', icon: BarChart, label: 'Analytics' },
        ];
      case 'worker':
        return [
          { href: '/worker', icon: Home, label: 'Dashboard', exact: true },
          { href: '/worker/messages', icon: MessageSquare, label: 'Messages' },
          { href: '/worker/assignments', icon: Users, label: 'Assignments' },
        ];
      case 'admin':
        return [
          { href: '/admin', icon: Home, label: 'Dashboard', exact: true },
          { href: '/admin/users', icon: Users, label: 'Manage Users' },
          { href: '/admin/workers', icon: Settings, label: 'Worker Assignments' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const getRoleConfig = () => {
    switch (user.role) {
      case 'fan':
        return {
          title: 'FanConnect',
          subtitle: 'Fan Dashboard',
          icon: '💎',
          gradient: 'from-pink-500 to-purple-600'
        };
      case 'model':
        return {
          title: 'FanConnect',
          subtitle: 'Model Dashboard',
          icon: '⭐',
          gradient: 'from-pink-500 to-purple-600'
        };
      case 'worker':
        return {
          title: 'FanConnect',
          subtitle: 'Worker Dashboard',
          icon: '💬',
          gradient: 'from-blue-500 to-cyan-600'
        };
      case 'admin':
        return {
          title: 'FanConnect',
          subtitle: 'Admin Dashboard',
          icon: '🛡️',
          gradient: 'from-gray-700 to-gray-900'
        };
      default:
        return {
          title: 'FanConnect',
          subtitle: '',
          icon: '❤️',
          gradient: 'from-pink-500 to-purple-600'
        };
    }
  };

  const roleConfig = getRoleConfig();

  return (
    <div className={cn(
      "w-64 bg-card border-r border-border flex flex-col h-full",
      className
    )} data-testid="sidebar">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-white text-lg",
            `bg-gradient-to-r ${roleConfig.gradient}`
          )}>
            {roleConfig.icon}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground" data-testid="app-title">
              {roleConfig.title}
            </h1>
            <p className="text-xs text-muted-foreground" data-testid="dashboard-subtitle">
              {roleConfig.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? location === item.href 
              : location.startsWith(item.href);
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start space-x-3",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
          
          <Button
            variant="ghost"
            onClick={onThemeClick}
            className="w-full justify-start space-x-3"
            data-testid="nav-themes"
          >
            <Palette className="w-4 h-4" />
            <span>Themes</span>
          </Button>
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar>
            <AvatarImage src={user.profileImage || undefined} />
            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="user-username">
              {user.username}
            </p>
            <p className="text-xs text-muted-foreground capitalize" data-testid="user-role">
              {user.role}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          onClick={logout}
          className="w-full justify-start space-x-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          data-testid="logout-button"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
