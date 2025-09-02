import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const UserStatus = () => {
  const { user, loading, hasPermission } = useAuth();
  const navigate = useNavigate();

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
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Not Logged In</h1>
          <Button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="container mx-auto max-w-2xl">
        <Card className="p-8">
          <h1 className="text-2xl font-bold text-neutral-900 mb-6">User Status</h1>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-neutral-900">User Information</h3>
              <div className="mt-2 space-y-2 text-sm">
                <p><strong>UID:</strong> {user.uid}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Display Name:</strong> {user.displayName}</p>
                <p><strong>Role:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-brand-red-600 text-white' :
                    user.role === 'agency' ? 'bg-accent-teal text-white' :
                    'bg-neutral-200 text-neutral-700'
                  }`}>
                    {user.role}
                  </span>
                </p>
                <p><strong>Active:</strong> {user.isActive ? 'Yes' : 'No'}</p>
                <p><strong>Created:</strong> {user.createdAt.toLocaleString()}</p>
                <p><strong>Last Login:</strong> {user.lastLoginAt.toLocaleString()}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900">Permissions</h3>
              <div className="mt-2 space-y-1 text-sm">
                <p>Admin Access: {hasPermission('admin') ? '✅ Yes' : '❌ No'}</p>
                <p>Agency Access: {hasPermission('agency') ? '✅ Yes' : '❌ No'}</p>
                <p>User Access: {hasPermission('user') ? '✅ Yes' : '❌ No'}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900">Available Actions</h3>
              <div className="mt-2 space-x-2">
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                >
                  Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/survey')} 
                  variant="outline"
                >
                  Survey
                </Button>
                {hasPermission('admin') && (
                  <Button 
                    onClick={() => navigate('/admin')} 
                    className="btn-primary"
                  >
                    Admin Dashboard
                  </Button>
                )}
              </div>
            </div>

            {!hasPermission('admin') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">Admin Access Required</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  To access admin features, you need to be logged in as an admin user. 
                  Currently logged in as: <strong>{user.role}</strong>
                </p>
                <div className="text-sm text-yellow-700">
                  <p><strong>To get admin access:</strong></p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Create the admin user document in Firestore (see setup guide)</li>
                    <li>Or login with the admin account: admin@careecho.com</li>
                    <li>Or ask an existing admin to promote your account</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserStatus;
