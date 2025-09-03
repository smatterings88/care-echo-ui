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
  Frown,
  MessageSquare,
  Coffee,
  Users as UsersIcon,
  Heart as HeartIcon,
  Activity as ActivityIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SurveyAnalytics, SurveyResponse, SurveyFilters } from "@/types/survey";
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
  const { user, getSurveyAnalytics, getSurveyResponses, getAgencies } = useAuth();
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [recentResponses, setRecentResponses] = useState<SurveyResponse[]>([]);
  const [agencies, setAgencies] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("7d");
  const [surveyTypeFilter, setSurveyTypeFilter] = useState("all");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [selectedAgency, setSelectedAgency] = useState<string>("all");

  useEffect(() => {
    loadAnalytics();
  }, [timeFilter, surveyTypeFilter, agencyFilter]);

  useEffect(() => {
    // Load agencies for admin users and managers
    if (user?.role === 'admin' || user?.role === 'manager') {
      loadAgencies();
    }
  }, [user?.role]);

  const loadAgencies = async () => {
    try {
      const agenciesData = await getAgencies();
      setAgencies(agenciesData || []);
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      if (loading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      // Build filters based on current filter state
      const filters: SurveyFilters = {};
      
      // Time filter
      if (timeFilter !== "all") {
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeFilter) {
          case "7d":
            startDate.setDate(endDate.getDate() - 7);
            break;
          case "30d":
            startDate.setDate(endDate.getDate() - 30);
            break;
          case "90d":
            startDate.setDate(endDate.getDate() - 90);
            break;
        }
        
        filters.dateRange = { start: startDate, end: endDate };
      }
      
      // Survey type filter
      if (surveyTypeFilter !== "all") {
        filters.surveyType = surveyTypeFilter as 'start' | 'end';
      }
      
      // Agency filter
      if (user?.role === 'agency' && user?.agencyId) {
        // Agency users can only see their own agency data
        filters.agencyId = user.agencyId;
      } else if (user?.role === 'manager' && user?.agencyIds && user.agencyIds.length > 0) {
        // Managers can see data from their assigned agencies
        if (selectedAgency !== "all") {
          filters.agencyId = selectedAgency;
        } else {
          filters.agencyIds = user.agencyIds;
        }
      } else if (user?.role === 'admin' && agencyFilter !== "all") {
        // Admin users can filter by specific agency
        filters.agencyId = agencyFilter;
      }
      
      // Get analytics data with filters
      const analyticsData = await getSurveyAnalytics(filters);
      setAnalytics(analyticsData);
      
      // Get recent responses with filters (last 20 for better analysis)
      const responses = await getSurveyResponses(filters);
      setRecentResponses(responses.slice(0, 20));
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // Support response analysis functions
  const analyzeWordFrequency = (responses: SurveyResponse[]) => {
    const supportResponses = responses
      .filter(r => r.responses.support && r.responses.support.trim().length > 0)
      .map(r => r.responses.support);
    
    const words = supportResponses
      .flatMap(r => r.toLowerCase().split(/\s+/))
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'they', 'have', 'from', 'their', 'would', 'there', 'could', 'been', 'were', 'will', 'more', 'when', 'said', 'each', 'which', 'time', 'them', 'some', 'make', 'into', 'than', 'first', 'been', 'its', 'after', 'most', 'other', 'many', 'then', 'these', 'so', 'people', 'may', 'well', 'only', 'very', 'just', 'now', 'over', 'think', 'also', 'around', 'another', 'even', 'through', 'back', 'years', 'where', 'much', 'before', 'mean', 'those', 'right', 'your', 'good', 'should', 'because', 'each', 'any', 'three', 'state', 'never', 'become', 'between', 'really', 'something', 'another', 'rather', 'though', 'against', 'always', 'something', 'every', 'often', 'together', 'shall', 'might', 'while', 'another', 'enough', 'almost', 'since', 'never', 'every', 'always', 'sometimes', 'usually', 'often', 'rarely', 'never'].includes(word));
    
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Sort by frequency and take top 20
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));
  };

  const categorizeSupportResponses = (responses: SurveyResponse[]) => {
    const categories = {
      "Social Support": 0,
      "Self-Care": 0,
      "Patient Interaction": 0,
      "Spiritual": 0,
      "Physical": 0,
      "Other": 0
    };
    
    const supportResponses = responses
      .filter(r => r.responses.support && r.responses.support.trim().length > 0)
      .map(r => r.responses.support);
    
    supportResponses.forEach(response => {
      const lower = response.toLowerCase();
      if (lower.includes('colleague') || lower.includes('team') || lower.includes('coworker') || lower.includes('friend') || lower.includes('family') || lower.includes('support')) {
        categories["Social Support"]++;
      } else if (lower.includes('coffee') || lower.includes('break') || lower.includes('rest') || lower.includes('music') || lower.includes('food') || lower.includes('lunch') || lower.includes('dinner')) {
        categories["Self-Care"]++;
      } else if (lower.includes('patient') || lower.includes('resident') || lower.includes('smile') || lower.includes('thank') || lower.includes('appreciate') || lower.includes('grateful')) {
        categories["Patient Interaction"]++;
      } else if (lower.includes('prayer') || lower.includes('meditation') || lower.includes('faith') || lower.includes('god') || lower.includes('spiritual') || lower.includes('blessed')) {
        categories["Spiritual"]++;
      } else if (lower.includes('exercise') || lower.includes('walk') || lower.includes('workout') || lower.includes('run') || lower.includes('gym') || lower.includes('yoga')) {
        categories["Physical"]++;
      } else {
        categories["Other"]++;
      }
    });
    
    return Object.entries(categories)
      .filter(([, count]) => count > 0)
      .map(([category, count]) => ({
        category,
        count,
        color: getSupportCategoryColor(category)
      }));
  };

  const getSupportCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Social Support": "#3b82f6", // blue-500
      "Self-Care": "#10b981", // green-500
      "Patient Interaction": "#8b5cf6", // violet-500
      "Spiritual": "#f59e0b", // amber-500
      "Physical": "#ef4444", // red-500
      "Other": "#6b7280" // gray-500
    };
    return colors[category] || "#6b7280";
  };

  const getSupportCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      "Social Support": UsersIcon,
      "Self-Care": Coffee,
      "Patient Interaction": HeartIcon,
      "Spiritual": HeartIcon,
      "Physical": ActivityIcon,
      "Other": MessageSquare
    };
    return icons[category] || MessageSquare;
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

  // Support analysis data
  const supportWordData = analyzeWordFrequency(recentResponses);
  const supportCategoryData = categorizeSupportResponses(recentResponses);

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
              disabled={refreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
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
            {refreshing && (
              <div className="flex items-center space-x-2 text-xs text-accent-teal-600">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
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
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Select 
              value={user?.role === 'admin' ? agencyFilter : selectedAgency} 
              onValueChange={user?.role === 'admin' ? setAgencyFilter : setSelectedAgency}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={
                  user?.role === 'admin' ? "All agencies" : 
                  user?.role === 'manager' ? "All my agencies" : "All agencies"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {user?.role === 'admin' ? "All agencies" : "All my agencies"}
                </SelectItem>
                {agencies
                  .filter(agency => 
                    user?.role === 'admin' || 
                    (user?.role === 'manager' && user?.agencyIds?.includes(agency.id))
                  )
                  .map((agency) => (
                    <SelectItem key={agency.id} value={agency.id}>
                      {agency.name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          )}
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

        {/* Support & Energy Analysis Section */}
        {supportWordData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Support Word Cloud */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-900">Support Themes</h3>
                <MessageSquare className="h-5 w-5 text-neutral-600" />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {supportWordData.map((item, index) => {
                  const maxCount = Math.max(...supportWordData.map(d => d.count));
                  const fontSize = Math.max(14, Math.min(32, (item.count / maxCount) * 24 + 12));
                  const opacity = Math.max(0.3, item.count / maxCount);
                  
                  return (
                    <span 
                      key={item.word}
                      className="px-3 py-1 rounded-full text-white font-medium cursor-pointer hover:scale-105 transition-transform"
                      style={{
                        fontSize: `${fontSize}px`,
                        backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                        boxShadow: `0 2px 4px rgba(59, 130, 246, ${opacity * 0.3})`
                      }}
                      title={`${item.word}: ${item.count} mentions`}
                    >
                      {item.word}
                    </span>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-500 text-center mt-4">
                Word size indicates frequency of mention in support responses
              </p>
            </Card>

            {/* Support Categories Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-900">Support Sources</h3>
                <BarChart3 className="h-5 w-5 text-neutral-600" />
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={supportCategoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const IconComponent = getSupportCategoryIcon(data.category);
                          return (
                            <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <IconComponent className="h-4 w-4" />
                                <span className="font-semibold">{data.category}</span>
                              </div>
                              <p className="text-sm text-neutral-600">Responses: <span className="font-semibold">{data.count}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {supportCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}

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

        {/* Recent Responses - Only show for admin users */}
        {user?.role === 'admin' && (
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
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
