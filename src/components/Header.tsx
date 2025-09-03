import { Bell, User, Menu, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const Header = () => {
  const { user, logout, hasPermission } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
          <Link to="/" className="text-neutral-900 hover:text-brand-red-600 transition-colors font-medium focus-ring">
            Dashboard
          </Link>
          <Link to="/survey" className="text-neutral-700 hover:text-brand-red-600 transition-colors font-medium focus-ring">
            Quick Check-In
          </Link>
          {hasPermission('admin') && (
            <Link to="/admin" className="text-neutral-700 hover:text-brand-red-600 transition-colors font-medium focus-ring">
              Admin
            </Link>
          )}
          {hasPermission('agency') && (
            <Link to="/analytics" className="text-neutral-700 hover:text-brand-red-600 transition-colors font-medium focus-ring">
              Analytics
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <div className="hidden md:flex items-center space-x-2 text-sm text-neutral-700">
                <span className="font-medium">{user.displayName}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' ? 'bg-brand-red-600 text-white' :
                  user.role === 'agency' ? 'bg-accent-teal text-white' :
                  'bg-neutral-200 text-neutral-700'
                }`}>
                  {user.role}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="relative text-neutral-900 hover:text-neutral-700 hover:bg-neutral-200">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-brand-red-600 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">2</span>
                </span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-neutral-900 hover:text-neutral-700 hover:bg-neutral-200"
                onClick={handleLogout}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
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