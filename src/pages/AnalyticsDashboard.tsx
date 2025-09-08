import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Heart,
  AlertTriangle,
  Smile,
  Meh,
  Frown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SurveyAnalytics, SurveyResponse, SurveyFilters } from "@/types/survey";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [agencies, setAgencies] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState("7d");
  const [surveyTypeFilter, setSurveyTypeFilter] = useState("all");
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [selectedAgency, setSelectedAgency] = useState<string>("all");

  useEffect(() => {
    loadAnalytics();
  }, [timeFilter, surveyTypeFilter, agencyFilter, selectedAgency]);

  useEffect(() => {
    // Load agencies for admin users and managers
    if (user?.role === 'super_admin' || user?.role === 'org_admin') {
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
      if (user?.role === 'site_admin' && user?.agencyId) {
        // Site_admin users can only see their own agency data
        filters.agencyId = user.agencyId;
      } else if (user?.role === 'org_admin' && user?.agencyIds && user.agencyIds.length > 0) {
        // Org_admins can see data from their assigned agencies
        if (selectedAgency !== "all") {
          filters.agencyId = selectedAgency;
        } else {
          filters.agencyIds = user.agencyIds;
        }
      } else if (user?.role === 'super_admin' && agencyFilter !== "all") {
        // Super_admin users can filter by specific agency
        filters.agencyId = agencyFilter;
      }
      
      // Get analytics data with filters
      const analyticsData = await getSurveyAnalytics(filters);
      setAnalytics(analyticsData);
      
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


  const getMoodIcon = (mood: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
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
      color: getMoodColor(mood)
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
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 py-1 flex items-center space-x-2 hover:bg-neutral-100"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>
                        {(user.displayName || '').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user.displayName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        user.role === 'super_admin' ? 'bg-brand-red-600 text-white' :
                        user.role === 'org_admin' ? 'bg-purple-600 text-white' :
                        user.role === 'site_admin' ? 'bg-accent-teal text-white' :
                        'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {user.role === 'super_admin' ? 'Super Admin' :
                       user.role === 'org_admin' ? 'Org Admin' :
                       user.role === 'site_admin' ? 'Site Admin' : 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        user.role === 'super_admin' ? 'bg-brand-red-600 text-white' :
                        user.role === 'org_admin' ? 'bg-purple-600 text-white' :
                        user.role === 'site_admin' ? 'bg-accent-teal text-white' :
                        'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {user.role === 'super_admin' ? 'Super Admin' :
                       user.role === 'org_admin' ? 'Org Admin' :
                       user.role === 'site_admin' ? 'Site Admin' : 'User'}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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
          {(user?.role === 'super_admin' || user?.role === 'org_admin') && (
            <Select 
              value={user?.role === 'super_admin' ? agencyFilter : selectedAgency} 
              onValueChange={user?.role === 'super_admin' ? setAgencyFilter : setSelectedAgency}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={
                  user?.role === 'super_admin' ? "All agencies" : 
                  user?.role === 'org_admin' ? "All my agencies" : "All agencies"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {user?.role === 'super_admin' ? "All agencies" : "All my agencies"}
                </SelectItem>
                {agencies
                  .filter(agency => 
                    user?.role === 'super_admin' || 
                    (user?.role === 'org_admin' && user?.agencyIds?.includes(agency.id))
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

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
