import { User, Menu, LogOut } from "lucide-react";
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
              
              {/* Admin users get admin panel */}
              {hasPermission('admin') && (
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