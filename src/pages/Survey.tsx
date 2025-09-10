import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getResponseV2, type Mood, type Stress } from "@/lib/responses";
import { useAuth } from "@/contexts/AuthContext";

const Survey = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, submitSurveyResponse } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get survey type from URL params
  const surveyType = searchParams.get('type') || 'start';

  // Check authentication and agency association
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the survey.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    // Check if user has agency association (required for all users except admins)
    if (user.role !== 'super_admin' && !user.agencyId) {
      toast({
        title: "Agency Association Required",
        description: "You must be associated with an agency to take surveys.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    setIsLoading(false);
  }, [user, navigate, toast]);
  
  const [responses, setResponses] = useState({
    mood: "",
    mainConcern: "",
    mainConcernOther: "",
    support: ""
  });

  const moods = [
    { emoji: "😃", label: "Great", value: "great" },
    { emoji: "🙂", label: "Okay", value: "okay" },
    { emoji: "😐", label: "Tired", value: "tired" },
    { emoji: "😔", label: "Stressed", value: "stressed" },
    { emoji: "😢", label: "Overwhelmed", value: "overwhelmed" }
  ];

  const mainConcerns = [
    "Resident grief or decline",
    "Family conflict", 
    "Workload / understaffing",
    "Supervisor or leadership issues",
    "Personal / outside stress",
    "Other"
  ];

  const getSurveyTitle = () => {
    return surveyType === 'start' ? 'Start Shift Check-In' : 'End Shift Check-In';
  };

  const getStepTitle = () => {
    if (surveyType === 'start') {
      switch (currentStep) {
        case 1: return 'Mood Check';
        case 2: return 'Main Concern';
        case 3: return 'Support & Energy';
        default: return 'Complete';
      }
    } else {
      switch (currentStep) {
        case 1: return 'Mood Check';
        case 2: return 'Stress Source';
        case 3: return 'Support & Energy';
        default: return 'Complete';
      }
    }
  };

  const getReflection = () => {
    const mood = responses.mood as Mood;
    const stressSource = responses.mainConcern as Stress;
    const hasSupport = responses.support.trim().length > 0;
    
    // Use the new response system with shift context
    const response = getResponseV2({
      shift: surveyType as "start" | "end",
      mood,
      stress: stressSource || "Other",
    });
    
    // Add support acknowledgment if user provided support text
    if (hasSupport) {
      return `${response} Hold onto those moments of support — they're your anchors.`;
    }
    
    return response;
  };

  const handleMoodSelect = (mood: string) => {
    setResponses(prev => ({ ...prev, mood }));
    setTimeout(() => setCurrentStep(2), 300);
  };

  const handleConcernSelect = (concern: string) => {
    if (concern === "Other") {
      setResponses(prev => ({ ...prev, mainConcern: concern }));
      return;
    }
    setResponses(prev => ({ ...prev, mainConcern: concern }));
    setTimeout(() => setCurrentStep(3), 300);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "User not authenticated. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      // Prepare survey data for submission
      const surveyData = {
        userId: user.uid,
        userEmail: user.email,
        userDisplayName: user.displayName,
        agencyId: user.agencyId || '',
        agencyName: user.agencyName || '',
        userRole: user.role,
        surveyType: surveyType as 'start' | 'end',
        responses: {
          mood: responses.mood,
          mainConcern: responses.mainConcern,
          mainConcernOther: responses.mainConcernOther,
          support: responses.support,
        },
        reflection: getReflection(),
        completedAt: new Date(),
      };

      // Submit survey response
      await submitSurveyResponse(surveyData);

      toast({
        title: "Survey Completed",
        description: "Thank you for taking the time to check in. Your wellbeing matters.",
      });
      
      // Navigate to dashboard to show updated completion status
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast({
        title: "Error",
        description: "Failed to save your survey response. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-600 mx-auto mb-4"></div>
          <p className="text-neutral-700">Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-brand-red-500/10 to-accent-teal/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent-teal/10 to-brand-red-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 sticky top-0 w-full border-b border-neutral-200 bg-neutral-100/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 focus-ring">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src="/logo.png" 
              alt="Care Echo Logo" 
              className="w-[10rem] h-12 object-contain"
            />
          </div>
          <h1 className="text-h3 text-neutral-900">{getSurveyTitle()}</h1>
          <div className="text-caption text-neutral-600">
            {currentStep}/4
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="relative z-10 w-full bg-neutral-200 h-1">
        <div 
          className="bg-gradient-to-r from-brand-red-600 to-accent-teal h-1 transition-all duration-500"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        {/* Step 1: Mood Check */}
        {currentStep === 1 && (
          <Card className="card-interactive p-8 animate-fade-in rounded-3xl shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-h2 text-neutral-900 mb-3">
                {surveyType === 'start' 
                  ? "How are you feeling as you begin your shift?"
                  : "How was your shift today?"
                }
              </h2>
              <p className="text-body text-neutral-600">
                Take a moment to check in with yourself
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {moods.map((mood) => (
                <Button
                  key={mood.value}
                  variant="outline"
                  className="h-16 text-lg justify-start space-x-4 hover:bg-brand-red-600/5 hover:border-brand-red-600 transition-all duration-300 focus-ring rounded-2xl"
                  onClick={() => handleMoodSelect(mood.value)}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="font-medium">{mood.label}</span>
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 2: Main Concern (Start) or Stress Source (End) */}
        {currentStep === 2 && (
          <Card className="card-interactive p-8 animate-fade-in rounded-3xl shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-h2 text-neutral-900 mb-3">
                {surveyType === 'start' 
                  ? "What's most on your mind as you start today?"
                  : "What drained you most during this shift?"
                }
              </h2>
              <p className="text-body text-neutral-600">
                {surveyType === 'start' 
                  ? "Understanding your concerns helps us support you better"
                  : "Understanding your stress helps us support you better"
                }
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {mainConcerns.map((concern) => (
                <Button
                  key={concern}
                  variant="outline"
                  className="h-14 text-left justify-start px-6 hover:bg-brand-red-600/5 hover:border-brand-red-600 transition-all duration-300 focus-ring rounded-2xl"
                  onClick={() => handleConcernSelect(concern)}
                >
                  <span className="font-medium">{concern}</span>
                </Button>
              ))}
            </div>

            {responses.mainConcern === "Other" && (
              <div className="mt-6 animate-slide-up">
                <Textarea
                  placeholder="Tell us what's on your mind..."
                  value={responses.mainConcernOther}
                  onChange={(e) => setResponses(prev => ({ ...prev, mainConcernOther: e.target.value }))}
                  className="resize-none rounded-2xl border-neutral-200 focus:border-brand-red-600 focus:ring-2 focus:ring-accent-teal"
                  rows={3}
                />
                <Button 
                  className="mt-4 w-full btn-primary rounded-2xl"
                  onClick={handleNext}
                  disabled={!responses.mainConcernOther.trim()}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Step 3: Support & Energy */}
        {currentStep === 3 && (
          <Card className="card-interactive p-8 animate-fade-in rounded-3xl shadow-2xl">
            <div className="text-center mb-8">
              <h2 className="text-h2 text-neutral-900 mb-3">
                {surveyType === 'start' 
                  ? "What might help you feel supported or energized this shift?"
                  : "What gave you energy or support today?"
                }
              </h2>
              <p className="text-body text-neutral-600">
                Optional - but we'd love to hear about the good moments
              </p>
            </div>

            <div className="space-y-6">
              <Textarea
                placeholder={surveyType === 'start' 
                  ? "A colleague's support, a moment of peace, something you're looking forward to..."
                  : "A colleague's smile, a patient's thank you, a moment of peace..."
                }
                value={responses.support}
                onChange={(e) => setResponses(prev => ({ ...prev, support: e.target.value }))}
                className="resize-none rounded-2xl border-neutral-200 focus:border-brand-red-600 focus:ring-2 focus:ring-accent-teal"
                rows={4}
              />
              
              <div className="flex flex-col gap-3">
                <Button 
                  className="btn-primary rounded-2xl"
                  onClick={handleNext}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handleNext}
                  className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-2xl focus-ring"
                >
                  Skip this step
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Reflection */}
        {currentStep === 4 && (
          <Card className="card-interactive p-8 animate-fade-in rounded-3xl shadow-2xl">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-r from-brand-red-600 to-accent-teal rounded-full flex items-center justify-center mx-auto animate-bounce-gentle shadow-lg">
                <span className="text-2xl">💙</span>
              </div>
              
              <div>
                <h2 className="text-h2 text-neutral-900 mb-4">
                  Thank you for checking in
                </h2>
                
                <div className="bg-gradient-to-r from-brand-red-600/5 to-accent-teal/5 rounded-2xl p-6 mb-6 border border-neutral-200">
                  <p className="text-quote text-neutral-900 leading-relaxed">
                    {(() => {
                      try {
                        return getReflection();
                      } catch (error) {
                        console.error('Error in getReflection:', error);
                        return "Thank you for taking the time to check in. Your wellbeing matters.";
                      }
                    })()}
                  </p>
                </div>

                <p className="text-body text-neutral-600 mb-6">
                  Your responses help us understand how to better support our healthcare heroes.
                </p>
              </div>

              <Button 
                className="btn-primary w-full rounded-2xl"
                onClick={handleSubmit}
              >
                Complete Check-In
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Survey;