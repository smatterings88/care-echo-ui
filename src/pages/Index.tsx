import { BarChart3, Users, FileText, TrendingUp } from "lucide-react";
import Header from "@/components/Header";
import SurveyCard from "@/components/SurveyCard";
import StatsCard from "@/components/StatsCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import heroImage from "@/assets/care-echo-hero.jpg";

const Index = () => {
  const surveys = [
    {
      title: "Patient Satisfaction Survey Q4",
      description: "Comprehensive survey to measure patient satisfaction across all departments including emergency care, surgery, and outpatient services.",
      responseCount: 84,
      status: "active" as const,
      createdAt: "Dec 1, 2024",
      category: "Patient Care"
    },
    {
      title: "Staff Wellness Check",
      description: "Monthly wellness assessment for healthcare staff focusing on burnout prevention and workplace satisfaction metrics.",
      responseCount: 42,
      status: "active" as const,
      createdAt: "Nov 28, 2024",
      category: "Staff Wellness"
    },
    {
      title: "Equipment Safety Audit",
      description: "Quarterly safety audit for medical equipment and facility infrastructure to ensure compliance with healthcare standards.",
      responseCount: 156,
      status: "completed" as const,
      createdAt: "Nov 15, 2024",
      category: "Safety"
    },
    {
      title: "New Treatment Protocol Feedback",
      description: "Gathering feedback on recently implemented treatment protocols from medical staff and department heads.",
      responseCount: 23,
      status: "draft" as const,
      createdAt: "Dec 2, 2024",
      category: "Medical"
    }
  ];

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
              <button className="btn-primary">
                Create New Survey
              </button>
              <button className="btn-secondary">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Surveys"
            value="24"
            change="+12% from last month"
            changeType="positive"
            icon={FileText}
          />
          <StatsCard
            title="Active Responses"
            value="1,247"
            change="+8% from last week"
            changeType="positive"
            icon={Users}
          />
          <StatsCard
            title="Completion Rate"
            value="92.4%"
            change="+2.1% improvement"
            changeType="positive"
            icon={TrendingUp}
          />
          <StatsCard
            title="Insights Generated"
            value="156"
            change="New this month"
            changeType="neutral"
            icon={BarChart3}
          />
        </div>
      </section>

      {/* Surveys Section */}
      <section className="container mx-auto px-4 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Recent Surveys</h2>
            <p className="text-muted-foreground">Manage and track your healthcare surveys</p>
          </div>
          <button className="btn-primary hidden md:block">
            Create Survey
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey, index) => (
            <div 
              key={survey.title}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <SurveyCard {...survey} />
            </div>
          ))}
        </div>
      </section>

      <FloatingActionButton />
    </div>
  );
};

export default Index;
