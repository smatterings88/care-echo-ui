import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
  requireAgency?: boolean; // New prop to require agency association
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = "user",
  fallbackPath = "/login",
  requireAgency = false
}) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackPath} replace />;
  }


  if (!hasPermission(requiredRole)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-error/10 border border-error text-error px-6 py-8 rounded-lg">
            <h1 className="text-xl font-bold mb-2">Access Denied</h1>
            <p className="text-sm">
              You don't have permission to access this page. Required role: {requiredRole}
            </p>
            <p className="text-sm mt-2">
              Your current role: {user.role}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check agency association if required
  if (requireAgency && user.role !== 'super_admin' && !user.agencyId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="bg-error/10 border border-error text-error px-6 py-8 rounded-lg">
            <h1 className="text-xl font-bold mb-2">Agency Association Required</h1>
            <p className="text-sm">
              You must be associated with an agency to access this feature.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
