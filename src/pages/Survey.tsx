import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Survey = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [responses, setResponses] = useState({
    mood: "",
    stressSource: "",
    stressSourceOther: "",
    support: ""
  });

  const moods = [
    { emoji: "😃", label: "Great", value: "great" },
    { emoji: "🙂", label: "Okay", value: "okay" },
    { emoji: "😐", label: "Tired", value: "tired" },
    { emoji: "😔", label: "Stressed", value: "stressed" },
    { emoji: "😢", label: "Overwhelmed", value: "overwhelmed" }
  ];

  const stressSources = [
    "Resident grief or decline",
    "Family conflict", 
    "Workload / understaffing",
    "Supervisor or leadership issues",
    "Personal / outside stress",
    "Other"
  ];

  const getReflection = () => {
    const mood = responses.mood;
    const hasSupport = responses.support.trim().length > 0;
    
    if (mood === "great" || mood === "okay") {
      return hasSupport 
        ? "Glad you found a bright spot today — hold onto that. You're making a difference every day."
        : "Sounds like a solid shift! Remember to celebrate the small wins along the way.";
    } else if (mood === "tired") {
      return "Tough shift, but you still showed up. That counts. Rest well and be kind to yourself tonight.";
    } else {
      return "Looks like today was heavy. Take 2 minutes before bed to breathe deeply and let the shift go. You matter.";
    }
  };

  const handleMoodSelect = (mood: string) => {
    setResponses(prev => ({ ...prev, mood }));
    setTimeout(() => setCurrentStep(2), 300);
  };

  const handleStressSelect = (source: string) => {
    if (source === "Other") {
      setResponses(prev => ({ ...prev, stressSource: source }));
      return;
    }
    setResponses(prev => ({ ...prev, stressSource: source }));
    setTimeout(() => setCurrentStep(3), 300);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = () => {
    toast({
      title: "Survey Completed",
      description: "Thank you for taking the time to check in. Your wellbeing matters.",
    });
    setTimeout(() => navigate("/"), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-300 bg-white/90 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-neutral-900 hover:text-neutral-700 hover:bg-neutral-200">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src="/logo.png" 
              alt="Care Echo Logo" 
              className="w-[10rem] h-12 object-contain"
            />
          </div>
          <h1 className="text-lg font-semibold text-neutral-900">Shift Check-In</h1>
          <div className="text-sm text-neutral-700">
            {currentStep}/4
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-neutral-300 h-1">
        <div 
          className="bg-gradient-to-r from-brand-red-600 to-accent-teal h-1 transition-all duration-500"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Step 1: Mood Check */}
        {currentStep === 1 && (
          <Card className="p-8 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                How was your shift today?
              </h2>
              <p className="text-neutral-700">
                Take a moment to check in with yourself
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {moods.map((mood) => (
                <Button
                  key={mood.value}
                  variant="outline"
                  className="h-16 text-lg justify-start space-x-4 hover:bg-brand-red-600/5 hover:border-brand-red-600 transition-all duration-300"
                  onClick={() => handleMoodSelect(mood.value)}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="font-medium">{mood.label}</span>
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Step 2: Stress Source */}
        {currentStep === 2 && (
          <Card className="p-8 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                What drained you most today?
              </h2>
              <p className="text-neutral-700">
                Understanding your stress helps us support you better
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {stressSources.map((source) => (
                <Button
                  key={source}
                  variant="outline"
                  className="h-14 text-left justify-start px-6 hover:bg-brand-red-600/5 hover:border-brand-red-600 transition-all duration-300"
                  onClick={() => handleStressSelect(source)}
                >
                  <span className="font-medium">{source}</span>
                </Button>
              ))}
            </div>

            {responses.stressSource === "Other" && (
              <div className="mt-6 animate-slide-up">
                <Textarea
                  placeholder="Tell us what's on your mind..."
                  value={responses.stressSourceOther}
                  onChange={(e) => setResponses(prev => ({ ...prev, stressSourceOther: e.target.value }))}
                  className="resize-none"
                  rows={3}
                />
                <Button 
                  className="mt-4 w-full btn-primary"
                  onClick={handleNext}
                  disabled={!responses.stressSourceOther.trim()}
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
          <Card className="p-8 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                What gave you energy or support today?
              </h2>
              <p className="text-neutral-700">
                Optional - but we'd love to hear about the good moments
              </p>
            </div>

            <div className="space-y-6">
              <Textarea
                placeholder="A colleague's smile, a patient's thank you, a moment of peace..."
                value={responses.support}
                onChange={(e) => setResponses(prev => ({ ...prev, support: e.target.value }))}
                className="resize-none"
                rows={4}
              />
              
              <div className="flex flex-col gap-3">
                <Button 
                  className="btn-primary"
                  onClick={handleNext}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handleNext}
                  className="text-neutral-700"
                >
                  Skip this step
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Reflection */}
        {currentStep === 4 && (
          <Card className="p-8 animate-fade-in">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-r from-brand-red-600 to-accent-teal rounded-full flex items-center justify-center mx-auto animate-bounce-gentle">
                <span className="text-2xl">💙</span>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                  Thank you for checking in
                </h2>
                
                <div className="bg-gradient-to-r from-brand-red-600/5 to-accent-teal/5 rounded-xl p-6 mb-6">
                  <p className="text-neutral-900 text-lg leading-relaxed">
                    {getReflection()}
                  </p>
                </div>

                <p className="text-neutral-700 mb-6">
                  Your responses help us understand how to better support our healthcare heroes.
                </p>
              </div>

              <Button 
                className="btn-primary w-full"
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