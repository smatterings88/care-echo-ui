import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";


const Index = () => {
  const { user } = useAuth();
  
  // Check if user can access surveys (authenticated and has agency association)
  const canAccessSurveys = user && (user.role === 'super_admin' || user.agencyId);
  
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
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 animate-fade-in">
              Your CNAs Are Quitting.
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6 animate-fade-in">
              You Just Don't Know It Yet.
            </h2>
            <p className="text-xl text-neutral-700 mb-4 animate-slide-up">
              CareEcho spots burnout before it becomes a $5K replacement cost.
            </p>
            <p className="text-lg text-neutral-600 mb-6 animate-slide-up">
              60-second check-ins. Anonymous alerts. Early intervention.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
              <Link to={canAccessSurveys ? "/survey?type=start" : "#"} onClick={(e) => !canAccessSurveys && e.preventDefault()}>
                <button 
                  className={`btn-primary w-full sm:w-64 ${!canAccessSurveys ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canAccessSurveys}
                >
                  START SHIFT CHECK-IN
                </button>
              </Link>
              <Link to={canAccessSurveys ? "/survey?type=end" : "#"} onClick={(e) => !canAccessSurveys && e.preventDefault()}>
                <button
                  className={`w-full sm:w-64 rounded-xl px-6 py-3 font-medium transition-colors border bg-[#F3ECE9] text-[#090B0B] border-[#C1BEBC] hover:bg-[#D9D3D0] focus:outline-none focus:ring-2 focus:ring-[#6DC8C5] focus:ring-offset-2 ${!canAccessSurveys ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!canAccessSurveys}
                >
                  END SHIFT CHECK-IN
                </button>
              </Link>
            </div>
            <div className="mt-8 space-y-2 animate-slide-up">
              <p className="text-neutral-900 font-semibold">Stop the turnover. Save the money. Protect your people.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

    </div>
  );
};

export default Index;
