import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Users, Calendar, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SurveyAnalytics, SurveyResponse } from "@/types/survey";

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, getSurveyAnalytics, getSurveyResponses } = useAuth();
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [recentResponses, setRecentResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get analytics data
      const analyticsData = await getSurveyAnalytics();
      setAnalytics(analyticsData);
      
      // Get recent responses (last 10)
      const responses = await getSurveyResponses();
      setRecentResponses(responses.slice(0, 10));
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (mood: string) => {
    const emojis: Record<string, string> = {
      great: "😃",
      okay: "🙂", 
      tired: "😐",
      stressed: "😔",
      overwhelmed: "😢"
    };
    return emojis[mood] || "😐";
  };

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      great: "bg-green-100 text-green-800",
      okay: "bg-blue-100 text-blue-800",
      tired: "bg-yellow-100 text-yellow-800", 
      stressed: "bg-orange-100 text-orange-800",
      overwhelmed: "bg-red-100 text-red-800"
    };
    return colors[mood] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-600 mx-auto mb-4"></div>
          <p className="text-neutral-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-lg font-semibold text-neutral-900">Survey Analytics</h1>
          <div className="text-sm text-neutral-700">
            {user?.displayName}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Responses</p>
                <p className="text-2xl font-bold text-neutral-900">{analytics?.totalResponses || 0}</p>
              </div>
              <div className="p-3 bg-brand-red-100 rounded-full">
                <Users className="h-6 w-6 text-brand-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Start Shift</p>
                <p className="text-2xl font-bold text-neutral-900">{analytics?.responsesByType.start || 0}</p>
              </div>
              <div className="p-3 bg-accent-teal/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-accent-teal" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">End Shift</p>
                <p className="text-2xl font-bold text-neutral-900">{analytics?.responsesByType.end || 0}</p>
              </div>
              <div className="p-3 bg-accent-teal/10 rounded-full">
                <TrendingDown className="h-6 w-6 text-accent-teal" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Avg Support Length</p>
                <p className="text-2xl font-bold text-neutral-900">{Math.round(analytics?.averageSupportLength || 0)}</p>
              </div>
              <div className="p-3 bg-accent-teal/10 rounded-full">
                <Activity className="h-6 w-6 text-accent-teal" />
              </div>
            </div>
          </Card>
        </div>

        {/* Mood Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Mood Distribution</h3>
            <div className="space-y-3">
              {analytics?.responsesByMood && Object.entries(analytics.responsesByMood).map(([mood, count]) => (
                <div key={mood} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{getMoodEmoji(mood)}</span>
                    <span className="font-medium capitalize">{mood}</span>
                  </div>
                  <Badge className={getMoodColor(mood)}>{count}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Main Concerns</h3>
            <div className="space-y-3">
              {analytics?.responsesByConcern && Object.entries(analytics.responsesByConcern).map(([concern, count]) => (
                <div key={concern} className="flex items-center justify-between">
                  <span className="font-medium text-sm">{concern}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Trends */}
        {analytics?.recentTrends && analytics.recentTrends.length > 0 && (
          <Card className="p-6 mb-8">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Trends (Last 7 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {analytics.recentTrends.map((trend) => (
                <div key={trend.date} className="text-center">
                  <p className="text-sm font-medium text-neutral-600">{new Date(trend.date).toLocaleDateString()}</p>
                  <p className="text-lg font-bold text-neutral-900">{trend.count}</p>
                  <p className="text-xs text-neutral-500">Avg Mood: {trend.averageMood.toFixed(1)}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Responses */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Responses</h3>
          <div className="space-y-4">
            {recentResponses.map((response) => (
              <div key={response.id} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getMoodEmoji(response.responses.mood)}</span>
                    <span className="font-medium">{response.userDisplayName}</span>
                    <Badge variant="outline" className="text-xs">
                      {response.surveyType === 'start' ? 'Start' : 'End'} Shift
                    </Badge>
                  </div>
                  <span className="text-sm text-neutral-500">
                    {new Date(response.completedAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-neutral-700 mb-2">
                  <strong>Concern:</strong> {response.responses.mainConcern}
                  {response.responses.mainConcernOther && ` - ${response.responses.mainConcernOther}`}
                </p>
                {response.responses.support && (
                  <p className="text-sm text-neutral-600">
                    <strong>Support:</strong> {response.responses.support}
                  </p>
                )}
                <p className="text-sm text-neutral-600 mt-2 italic">
                  "{response.reflection}"
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
