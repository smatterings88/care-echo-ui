import { Link, Navigate } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import Login from "@/pages/Login";


const Index = () => {
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Check if user can access surveys (authenticated and has agency association)
  const canAccessSurveys = user && (user.role === 'super_admin' || user.agencyId);
  
  // Redirect regular users to the new dashboard
  if (user && user.role === 'user' && user.agencyId) {
    return <Navigate to="/dashboard" replace />;
  }

  // Handle analytics button click
  const handleAnalyticsClick = () => {
    if (user) {
      // User is logged in, go to analytics
      window.location.href = '/analytics';
    } else {
      // User is not logged in, show login modal
      setShowLoginModal(true);
    }
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-red-600/5 via-accent-teal/10 to-neutral-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-transparent z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(https://storage.googleapis.com/msgsndr/JBLl8rdfV29DRcGjQ7Rl/media/68b6a6705201562e145a62aa.png)` }}
        />
        <div className="relative z-20 container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-h1 text-neutral-900 mb-6 animate-fade-in">
              Your CNAs Are Quitting.
            </h1>
            <h2 className="text-h2 text-neutral-900 mb-6 animate-fade-in">
              You Just Don't Know It Yet.
            </h2>
            <p className="text-body text-neutral-700 mb-4 animate-slide-up">
              CareEcho spots burnout before it becomes a $5K replacement cost.
            </p>
            <p className="text-body-sm text-neutral-600 mb-6 animate-slide-up">
              60-second check-ins. Anonymous alerts. Early intervention.
            </p>
            <div className="flex justify-center animate-slide-up">
              <button 
                onClick={handleAnalyticsClick}
                className="btn-primary w-full sm:w-[17rem]"
              >
                View Analytics
              </button>
            </div>
            <div className="mt-8 space-y-2 animate-slide-up">
              <p className="text-body text-neutral-900 font-semibold">Stop the turnover. Save the money. Protect your people.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-700 text-2xl"
            >
              ×
            </button>
            <Login onSuccess={() => setShowLoginModal(false)} />
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;
