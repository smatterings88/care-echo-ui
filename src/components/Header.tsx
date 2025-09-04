import { User, Menu, LogOut, Settings, ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import md5 from "crypto-js/md5";

const Header = () => {
  const { user, logout, hasPermission } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Generate Gravatar URL from email
  const getGravatarUrl = (email: string) => {
    const hash = md5(email.toLowerCase().trim()).toString();
    return `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;
  };

  // Get user initials for avatar fallback
  const getUserInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-300 bg-white/90 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="md:hidden text-neutral-900 hover:text-neutral-700 hover:bg-neutral-200">
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Care Echo Logo" 
              className="w-[10rem] h-12 object-contain"
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          {/* Show different navigation based on user type */}
          {user ? (
            <>
              {/* All logged-in users can access surveys */}
              <Link to="/survey?type=start" className="text-neutral-700 hover:text-brand-red-600 transition-colors font-medium focus-ring">
                Start Shift Check-In
              </Link>
              <Link to="/survey?type=end" className="text-neutral-700 hover:text-brand-red-600 transition-colors font-medium focus-ring">
                End Shift Check-In
              </Link>
              
              {/* Admins and managers get admin panel */}
              {hasPermission('manager') && (
                <Link to="/admin" className="text-neutral-700 hover:text-brand-red-600 transition-colors font-medium focus-ring">
                  Admin Panel
                </Link>
              )}
              
              {/* Agency users and admins get analytics */}
              {hasPermission('agency') && (
                <Link to="/analytics" className="text-neutral-700 hover:text-brand-red-600 transition-colors font-medium focus-ring">
                  Analytics
                </Link>
              )}
            </>
          ) : (
            /* Non-logged in users see basic navigation */
            <Link to="/" className="text-neutral-900 hover:text-brand-red-600 transition-colors font-medium focus-ring">
              Home
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-neutral-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage 
                      src={getGravatarUrl(user.email)} 
                      alt={user.displayName}
                    />
                    <AvatarFallback className="bg-accent-teal text-white text-sm font-medium">
                      {getUserInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium text-neutral-900">{user.displayName}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.role === 'admin' ? 'bg-brand-red-600 text-white' :
                      user.role === 'manager' ? 'bg-purple-600 text-white' :
                      user.role === 'agency' ? 'bg-accent-teal text-white' :
                      'bg-neutral-200 text-neutral-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-neutral-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/survey?type=start" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Start Shift Check-In</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/survey?type=end" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>End Shift Check-In</span>
                  </Link>
                </DropdownMenuItem>
                {hasPermission('agency') && (
                  <DropdownMenuItem asChild>
                    <Link to="/analytics" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Analytics</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {hasPermission('manager') && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/change-password" className="cursor-pointer">
                    <Lock className="mr-2 h-4 w-4" />
                    <span>Change Password</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild className="btn-primary">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;