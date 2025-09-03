import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  Heart,
  AlertTriangle,
  Smile,
  Meh,
  Frown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SurveyAnalytics, SurveyResponse } from "@/types/survey";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, getSurveyAnalytics, getSurveyResponses } = useAuth();
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [recentResponses, setRecentResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("7d");
  const [surveyTypeFilter, setSurveyTypeFilter] = useState("all");

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

  const getMoodIcon = (mood: string) => {
    const icons: Record<string, any> = {
      great: Smile,
      okay: Meh,
      tired: Frown,
      stressed: AlertTriangle,
      overwhelmed: Heart
    };
    return icons[mood] || Meh;
  };

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      great: "#10b981", // green-500
      okay: "#3b82f6", // blue-500
      tired: "#f59e0b", // amber-500
      stressed: "#f97316", // orange-500
      overwhelmed: "#ef4444" // red-500
    };
    return colors[mood] || "#6b7280";
  };

  const getConcernColor = (concern: string) => {
    const colors: Record<string, string> = {
      'Resident grief or decline': "#8b5cf6", // violet-500
      'Family conflict': "#ec4899", // pink-500
      'Workload / understaffing': "#f59e0b", // amber-500
      'Supervisor or leadership issues': "#ef4444", // red-500
      'Personal / outside stress': "#06b6d4", // cyan-500
      'Other': "#6b7280" // gray-500
    };
    return colors[concern] || "#6b7280";
  };

  // Prepare data for charts
  const moodChartData = analytics?.responsesByMood ? 
    Object.entries(analytics.responsesByMood).map(([mood, count]) => ({
      name: mood.charAt(0).toUpperCase() + mood.slice(1),
      value: count,
      color: getMoodColor(mood),
      emoji: getMoodEmoji(mood)
    })) : [];

  const concernChartData = analytics?.responsesByConcern ?
    Object.entries(analytics.responsesByConcern).map(([concern, count]) => ({
      name: concern,
      value: count,
      color: getConcernColor(concern)
    })) : [];

  const trendChartData = analytics?.recentTrends ?
    analytics.recentTrends.map((trend) => ({
      date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      responses: trend.count,
      avgMood: trend.averageMood
    })) : [];

  const filteredResponses = recentResponses.filter(response => {
    if (surveyTypeFilter !== "all" && response.surveyType !== surveyTypeFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-red-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Loading Analytics</h2>
          <p className="text-neutral-600">Gathering your survey insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")} 
              className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src="/logo.png" 
              alt="Care Echo Logo" 
              className="w-[10rem] h-12 object-contain"
            />
          </div>
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-neutral-900">Survey Analytics</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
          <div className="text-sm text-neutral-700 font-medium">
            {user?.displayName}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Filters:</span>
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={surveyTypeFilter} onValueChange={setSurveyTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All surveys</SelectItem>
              <SelectItem value="start">Start shift</SelectItem>
              <SelectItem value="end">End shift</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-brand-red-50 to-brand-red-100 border-brand-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-red-700 mb-1">Total Responses</p>
                <p className="text-3xl font-bold text-brand-red-900">{analytics?.totalResponses || 0}</p>
                <p className="text-xs text-brand-red-600 mt-1">All time</p>
              </div>
              <div className="p-3 bg-brand-red-200 rounded-full">
                <Users className="h-6 w-6 text-brand-red-700" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-accent-teal-50 to-accent-teal-100 border-accent-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-accent-teal-700 mb-1">Start Shift</p>
                <p className="text-3xl font-bold text-accent-teal-900">{analytics?.responsesByType.start || 0}</p>
                <p className="text-xs text-accent-teal-600 mt-1">Morning check-ins</p>
              </div>
              <div className="p-3 bg-accent-teal-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-accent-teal-700" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-accent-teal-50 to-accent-teal-100 border-accent-teal-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-accent-teal-700 mb-1">End Shift</p>
                <p className="text-3xl font-bold text-accent-teal-900">{analytics?.responsesByType.end || 0}</p>
                <p className="text-xs text-accent-teal-600 mt-1">Evening check-ins</p>
              </div>
              <div className="p-3 bg-accent-teal-200 rounded-full">
                <TrendingDown className="h-6 w-6 text-accent-teal-700" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-neutral-50 to-neutral-100 border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-1">Avg Support Length</p>
                <p className="text-3xl font-bold text-neutral-900">{Math.round(analytics?.averageSupportLength || 0)}</p>
                <p className="text-xs text-neutral-600 mt-1">Characters</p>
              </div>
              <div className="p-3 bg-neutral-200 rounded-full">
                <Activity className="h-6 w-6 text-neutral-700" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Mood Distribution Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Mood Distribution</h3>
              <BarChart3 className="h-5 w-5 text-neutral-600" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-xl">{data.emoji}</span>
                              <span className="font-semibold">{data.name}</span>
                            </div>
                            <p className="text-sm text-neutral-600">Responses: <span className="font-semibold">{data.value}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {moodChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Concerns Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Main Concerns</h3>
              <PieChart className="h-5 w-5 text-neutral-600" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={concernChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {concernChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
                            <p className="font-semibold text-sm">{data.name}</p>
                            <p className="text-sm text-neutral-600">Responses: <span className="font-semibold">{data.value}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {concernChartData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Trends Chart */}
        {trendChartData.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900">Response Trends</h3>
              <LineChart className="h-5 w-5 text-neutral-600" />
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={trendChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                                     <Tooltip 
                     content={({ active, payload, label }) => {
                       if (active && payload && payload.length) {
                         const avgMoodValue = payload[1]?.value;
                         const avgMoodFormatted = typeof avgMoodValue === 'number' ? avgMoodValue.toFixed(1) : avgMoodValue;
                         return (
                           <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
                             <p className="font-semibold text-sm">{label}</p>
                             <p className="text-sm text-neutral-600">Responses: <span className="font-semibold">{payload[0].value}</span></p>
                             <p className="text-sm text-neutral-600">Avg Mood: <span className="font-semibold">{avgMoodFormatted}</span></p>
                           </div>
                         );
                       }
                       return null;
                     }}
                   />
                  <Line 
                    type="monotone" 
                    dataKey="responses" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgMood" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-neutral-600">Daily Responses</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-neutral-600">Average Mood Score</span>
              </div>
            </div>
          </Card>
        )}

        {/* Recent Responses */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Recent Responses</h3>
            <Eye className="h-5 w-5 text-neutral-600" />
          </div>
          <div className="space-y-4">
            {filteredResponses.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-600">No responses found with current filters</p>
              </div>
            ) : (
              filteredResponses.map((response) => (
                <div key={response.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getMoodEmoji(response.responses.mood)}</span>
                      <div>
                        <p className="font-semibold text-neutral-900">{response.userDisplayName}</p>
                        <p className="text-sm text-neutral-600">{response.agencyName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          response.surveyType === 'start' 
                            ? 'border-accent-teal-200 text-accent-teal-700 bg-accent-teal-50' 
                            : 'border-brand-red-200 text-brand-red-700 bg-brand-red-50'
                        }`}
                      >
                        {response.surveyType === 'start' ? 'Start' : 'End'} Shift
                      </Badge>
                      <span className="text-xs text-neutral-500">
                        {new Date(response.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-neutral-700">Concern:</span>
                      <span className="text-sm text-neutral-600">{response.responses.mainConcern}</span>
                      {response.responses.mainConcernOther && (
                        <span className="text-sm text-neutral-500 italic">- {response.responses.mainConcernOther}</span>
                      )}
                    </div>
                    {response.responses.support && (
                      <div className="flex items-start space-x-2">
                        <span className="text-sm font-medium text-neutral-700">Support:</span>
                        <span className="text-sm text-neutral-600">{response.responses.support}</span>
                      </div>
                    )}
                    <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                      <p className="text-sm text-neutral-700 italic">"{response.reflection}"</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
