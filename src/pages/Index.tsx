import { Link } from "react-router-dom";
import Header from "@/components/Header";
import FloatingActionButton from "@/components/FloatingActionButton";
import heroImage from "@/assets/care-echo-hero.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-healthcare-mint/10 to-background overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 to-transparent z-10" />
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative z-20 container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 animate-fade-in">
              Healthcare Insights,
              <span className="bg-gradient-to-r from-primary to-healthcare-green bg-clip-text text-transparent">
                {" "}Simplified
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 animate-slide-up">
              Streamline your healthcare surveys with intelligent analytics and beautiful, mobile-first design that puts patient care first.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
              <Link to="/survey">
                <button className="btn-primary">
                  Start Shift Check-In
                </button>
              </Link>
              <button className="btn-secondary">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </section>


      <FloatingActionButton />
    </div>
  );
};

export default Index;
