import { User, Menu, LogOut, Settings, ChevronDown, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { useState } from "react";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-neutral-900 hover:text-neutral-700 hover:bg-neutral-200 focus-ring"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link to="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
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
              {/* Regular users get dashboard link */}
              {user.role === 'user' && (
                <Link to="/dashboard" className="text-neutral-700 hover:text-brand-red-600 transition-colors text-caption focus-ring">
                  Dashboard
                </Link>
              )}
              
              {/* Only regular users can access survey links */}
              {user.role === 'user' && (
                <>
                  <Link to="/survey?type=start" className="text-neutral-700 hover:text-brand-red-600 transition-colors text-caption focus-ring">
                    Start Shift Check-In
                  </Link>
                  <Link to="/survey?type=end" className="text-neutral-700 hover:text-brand-red-600 transition-colors text-caption focus-ring">
                    End Shift Check-In
                  </Link>
                </>
              )}
              
              {/* Super_admins and org_admins get admin panel */}
              {hasPermission('org_admin') && (
                <Link to="/admin" className="text-neutral-700 hover:text-brand-red-600 transition-colors text-caption focus-ring">
                  Admin Panel
                </Link>
              )}

              {/* Site_admins and super_admins get analytics */}
              {hasPermission('site_admin') && (
                <Link to="/analytics" className="text-neutral-700 hover:text-brand-red-600 transition-colors text-caption focus-ring">
                  Analytics
                </Link>
              )}
            </>
          ) : (
            /* Non-logged in users see basic navigation */
            <Link to="/" className="text-neutral-900 hover:text-brand-red-600 transition-colors text-caption focus-ring">
              Home
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-neutral-100 cursor-pointer border border-transparent hover:border-neutral-300"
                  >
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
                        user.role === 'super_admin' ? 'bg-brand-red-600 text-white' :
                        user.role === 'org_admin' ? 'bg-purple-600 text-white' :
                        user.role === 'site_admin' ? 'bg-accent-teal text-white' :
                        'bg-neutral-200 text-neutral-700'
                      }`}>
                        {user.role === 'super_admin' ? 'Super Admin' :
                         user.role === 'org_admin' ? 'Org Admin' :
                         user.role === 'site_admin' ? 'Site Admin' :
                         'User'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-neutral-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 z-50 bg-white border border-neutral-200 shadow-lg" 
                  align="end" 
                  side="bottom" 
                  alignOffset={5}
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.role === 'super_admin' ? 'bg-brand-red-600 text-white' :
                      user.role === 'org_admin' ? 'bg-purple-600 text-white' :
                      user.role === 'site_admin' ? 'bg-accent-teal text-white' :
                      'bg-neutral-200 text-neutral-700'
                    }`}>
                      {user.role === 'super_admin' ? 'Super Admin' :
                       user.role === 'org_admin' ? 'Org Admin' :
                       user.role === 'site_admin' ? 'Site Admin' :
                       'User'}
                    </span>
                  </DropdownMenuItem>
                  {/* Show facility names for different user types */}
                  {user.role === 'org_admin' && user.agencyNames && user.agencyNames.length > 0 && (
                    <DropdownMenuItem disabled>
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs font-medium text-neutral-700">Assigned Facilities:</span>
                        {user.agencyNames.map((facilityName, index) => (
                          <span key={index} className="text-xs text-neutral-600 ml-2">
                            • {facilityName}
                          </span>
                        ))}
                      </div>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'site_admin' && user.agencyName && (
                    <DropdownMenuItem disabled>
                      <div className="flex flex-col space-y-1">
                        <span className="text-xs font-medium text-neutral-700">Assigned Facility:</span>
                        <span className="text-xs text-neutral-600 ml-2">• {user.agencyName}</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'user' && user.agencyName && (
                    <DropdownMenuItem disabled>
                      <span className="text-xs text-neutral-600">{user.agencyName}</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {user.role === 'user' && (
                    <>
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
                    </>
                  )}
                  {hasPermission('site_admin') && (
                    <DropdownMenuItem asChild>
                      <Link to="/analytics" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Analytics</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {hasPermission('org_admin') && (
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
            </div>
          ) : (
            <Button asChild className="btn-primary">
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 shadow-lg">
          <div className="px-4 py-4 space-y-4">
            {user ? (
              <>
                {/* User info */}
                <div className="flex items-center space-x-3 pb-4 border-b border-neutral-200">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={getGravatarUrl(user.email)} 
                      alt={user.displayName}
                    />
                    <AvatarFallback className="bg-accent-teal text-white text-sm font-medium">
                      {getUserInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-neutral-900">{user.displayName}</span>
                    <span className="text-xs text-neutral-600">{user.email}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium mt-1 inline-block w-fit ${
                      user.role === 'super_admin' ? 'bg-brand-red-600 text-white' :
                      user.role === 'org_admin' ? 'bg-purple-600 text-white' :
                      user.role === 'site_admin' ? 'bg-accent-teal text-white' :
                      'bg-neutral-200 text-neutral-700'
                    }`}>
                      {user.role === 'super_admin' ? 'Super Admin' :
                       user.role === 'org_admin' ? 'Org Admin' :
                       user.role === 'site_admin' ? 'Site Admin' :
                       'User'}
                    </span>
                  </div>
                </div>

                {/* Navigation links */}
                <div className="space-y-2">
                  {/* Regular users get dashboard link */}
                  {user.role === 'user' && (
                    <Link 
                      to="/dashboard" 
                      className="block px-3 py-2 text-neutral-700 hover:text-brand-red-600 hover:bg-neutral-50 rounded-lg transition-colors text-caption focus-ring"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  
                  {/* Only regular users can access survey links */}
                  {user.role === 'user' && (
                    <>
                      <Link 
                        to="/survey?type=start" 
                        className="block px-3 py-2 text-neutral-700 hover:text-brand-red-600 hover:bg-neutral-50 rounded-lg transition-colors text-caption focus-ring"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Start Shift Check-In
                      </Link>
                      
                      <Link 
                        to="/survey?type=end" 
                        className="block px-3 py-2 text-neutral-700 hover:text-brand-red-600 hover:bg-neutral-50 rounded-lg transition-colors text-caption focus-ring"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        End Shift Check-In
                      </Link>
                    </>
                  )}
                  
                  {/* Super_admins and org_admins get admin panel */}
                  {hasPermission('org_admin') && (
                    <Link 
                      to="/admin" 
                      className="block px-3 py-2 text-neutral-700 hover:text-brand-red-600 hover:bg-neutral-50 rounded-lg transition-colors text-caption focus-ring"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}

                  {/* Site_admins and super_admins get analytics */}
                  {hasPermission('site_admin') && (
                    <Link 
                      to="/analytics" 
                      className="block px-3 py-2 text-neutral-700 hover:text-brand-red-600 hover:bg-neutral-50 rounded-lg transition-colors text-caption focus-ring"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Analytics
                    </Link>
                  )}

                  <Link 
                    to="/change-password" 
                    className="block px-3 py-2 text-neutral-700 hover:text-brand-red-600 hover:bg-neutral-50 rounded-lg transition-colors text-caption focus-ring"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Change Password
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-caption focus-ring"
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              /* Non-logged in users see basic navigation */
              <div className="space-y-2">
                <Link 
                  to="/" 
                  className="block px-3 py-2 text-neutral-900 hover:text-brand-red-600 hover:bg-neutral-50 rounded-lg transition-colors text-caption focus-ring"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 bg-brand-red-600 text-white hover:bg-brand-red-700 rounded-lg transition-colors text-caption focus-ring text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;