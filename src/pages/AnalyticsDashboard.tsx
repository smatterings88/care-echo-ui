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
  Frown,
  Building2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { SurveyAnalytics, SurveyResponse, SurveyFilters } from "@/types/survey";
import { AgencyData } from "@/types/auth";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, Line, LineChart as RechartsLineChart, Pie, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, getSurveyAnalytics, getSurveyResponses, getAgencies } = useAuth();
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [responsesRaw, setResponsesRaw] = useState<SurveyResponse[]>([]);
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
      
      // Always filter to only show regular users' data (not admin users)
      filters.userRole = 'user';
      
      // Debug logging for scope validation
      console.log('Analytics filters applied:', {
        userRole: user?.role,
        filters: filters,
        agencyScope: user?.role === 'site_admin' ? user.agencyId : 
                    user?.role === 'org_admin' ? user.agencyIds : 
                    user?.role === 'super_admin' ? 'all' : 'none'
      });
      
      // Get analytics data with filters
      const analyticsData = await getSurveyAnalytics(filters);
      const raw = await getSurveyResponses(filters);
      setAnalytics(analyticsData);
      setResponsesRaw(raw);
      
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

  // 1) Heatmap calendar (last 28 days): build a date -> count map
  const buildDateKey = (d: Date) => d.toISOString().split('T')[0];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 27);
  const dayList: Date[] = Array.from({ length: 28 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
  const countsByDay: Record<string, number> = {};
  for (const d of dayList) countsByDay[buildDateKey(d)] = 0;
  responsesRaw.forEach(r => {
    const raw = (r as any).completedAt;
    const dt = typeof (raw as any)?.toDate === 'function' ? (raw as any).toDate() : (raw instanceof Date ? raw : new Date(raw));
    if (!isNaN(dt.getTime())) {
      const key = buildDateKey(dt);
      if (key in countsByDay) countsByDay[key] += 1;
    }
  });
  const heatmapData = dayList.map(d => ({
    date: d,
    key: buildDateKey(d),
    count: countsByDay[buildDateKey(d)] || 0,
  }));

  // 2) Stacked mood-by-shift chart (100% stacked with percentages)
  const moods = ['great', 'okay', 'tired', 'stressed', 'overwhelmed'] as const;
  const moodByShiftBase = { start: Object.fromEntries(moods.map(m => [m, 0])) as Record<string, number>, end: Object.fromEntries(moods.map(m => [m, 0])) as Record<string, number> };
  const moodByShiftAgg = JSON.parse(JSON.stringify(moodByShiftBase)) as typeof moodByShiftBase;
  responsesRaw.forEach(r => {
    const type = r.surveyType; // 'start' | 'end'
    const mood = r.responses.mood as string;
    if ((type === 'start' || type === 'end') && moods.includes(mood as any)) {
      moodByShiftAgg[type][mood] = (moodByShiftAgg[type][mood] || 0) + 1;
    }
  });
  const buildMoodPieData = (counts: Record<string, number>) => {
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return moods.map((m) => ({
      key: m,
      name: m.charAt(0).toUpperCase() + m.slice(1),
      value: counts[m] || 0,
      pct: Number((((counts[m] || 0) / total) * 100).toFixed(1)),
      color: getMoodColor(m),
      total,
    }));
  };
  const moodByShiftStartPie = buildMoodPieData(moodByShiftAgg.start);
  const moodByShiftEndPie = buildMoodPieData(moodByShiftAgg.end);

  // 3) Facility response leaderboard (scoped)
  const nameById: Record<string, string> = Object.fromEntries(agencies.map(a => [a.id, a.name]));
  const countByFacility: Record<string, number> = {};
  responsesRaw.forEach(r => {
    const id = (r as any).agencyId || 'unknown';
    countByFacility[id] = (countByFacility[id] || 0) + 1;
  });
  const leaderboard = Object.entries(countByFacility)
    .map(([id, count]) => ({ id, name: nameById[id] || (id === 'unknown' ? 'Unknown facility' : id), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);


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
          {/* Scope indicator */}
          <div className="text-xs text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full flex-1 flex justify-center items-center">
            {(() => {
              if (user?.role === 'super_admin') {
                const label = agencyFilter !== 'all' ? '1 facility' : 'All facilities';
                return `Showing: ${label} • Regular users only`;
              }
              if (user?.role === 'org_admin') {
                const label = selectedAgency !== 'all' ? '1 facility' : `${user?.agencyIds?.length || 0} facilities`;
                return `Showing: ${label} • Regular users only`;
              }
              if (user?.role === 'site_admin') {
                return 'Showing: Your facility • Regular users only';
              }
              return 'Showing: No access';
            })()}
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
                  user?.role === 'super_admin' ? "All facilities" : 
                  user?.role === 'org_admin' ? "All my facilities" : "All facilities"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {user?.role === 'super_admin' ? "All facilities" : "All my facilities"}
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

        {/* Facility Display */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-neutral-700 mb-3">Data Sources</h3>
          <div className="flex flex-wrap gap-3">
            {(() => {
              // Determine which facilities are being shown
              let facilitiesToShow: AgencyData[] = [];
              
              if (user?.role === 'super_admin') {
                if (agencyFilter === 'all') {
                  facilitiesToShow = agencies;
                } else {
                  const selectedFacility = agencies.find(a => a.id === agencyFilter);
                  if (selectedFacility) facilitiesToShow = [selectedFacility];
                }
              } else if (user?.role === 'org_admin') {
                if (selectedAgency === 'all') {
                  facilitiesToShow = agencies.filter(agency => user?.agencyIds?.includes(agency.id));
                } else {
                  const selectedFacility = agencies.find(a => a.id === selectedAgency);
                  if (selectedFacility) facilitiesToShow = [selectedFacility];
                }
              } else if (user?.role === 'site_admin') {
                const userFacility = agencies.find(a => a.id === user?.agencyId);
                if (userFacility) facilitiesToShow = [userFacility];
              }

              if (facilitiesToShow.length === 0) {
                return (
                  <div className="text-sm text-neutral-500 italic">
                    No facilities available
                  </div>
                );
              }

              return facilitiesToShow.map((facility) => (
                <div
                  key={facility.id}
                  className="flex items-center space-x-2 bg-white border border-neutral-200 rounded-lg px-3 py-2"
                >
                  {/* Facility Logo */}
                  <div className="flex-shrink-0">
                    {facility.logoUrl ? (
                      <img
                        src={facility.logoUrl}
                        alt={`${facility.name} logo`}
                        className="w-6 h-6 object-cover rounded border border-neutral-200"
                        onError={(e) => {
                          // Hide image if it fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-6 h-6 bg-neutral-100 rounded border border-neutral-200 flex items-center justify-center">
                        <Building2 className="h-3 w-3 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Facility Name */}
                  <span className="text-sm font-medium text-neutral-700">
                    {facility.name}
                  </span>
                </div>
              ));
            })()}
          </div>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <BarChart3 className="h-5 w-5 text-neutral-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Distribution of moods across all responses in scope.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={moodChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <RechartsTooltip 
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PieChart className="h-5 w-5 text-neutral-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Top concern categories selected in responses.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                  <RechartsTooltip 
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <LineChart className="h-5 w-5 text-neutral-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Daily responses and average mood over time.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={trendChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <RechartsTooltip 
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

        {/* 1) 28-day Heatmap Calendar (Super Admin only) */}
        {user?.role === 'super_admin' && (
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Activity Heatmap (28 days)</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Calendar className="h-5 w-5 text-neutral-600" />
                </TooltipTrigger>
                <TooltipContent>
                  Heatmap of total responses per day for the last 28 days.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', gap: '4px' }}
          >
            {heatmapData.map((d, idx) => {
              const c = d.count;
              const intensity = c >= 8 ? 'bg-brand-red-700' : c >= 5 ? 'bg-brand-red-500' : c >= 3 ? 'bg-brand-red-300' : c >= 1 ? 'bg-brand-red-100' : 'bg-neutral-50';
              return (
                <div key={d.key} className="flex flex-col items-center">
                  <div
                    className={`w-full h-5 rounded-sm ${intensity} border border-neutral-200`}
                    title={`${new Date(d.key).toLocaleDateString()}: ${c} responses`}
                  />
                  {/* Optional per-cell tiny date label: only show for each 7th bucket to avoid clutter */}
                  {((idx % 7) === 0) && (
                    <div className="mt-1 text-[10px] text-neutral-400">
                      {new Date(d.key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Start/End date labels */}
          <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
            <span>{start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="mt-3 flex items-center space-x-2 text-xs text-neutral-500">
            <span>Less</span>
            <div className="w-4 h-3 bg-neutral-200 rounded"></div>
            <div className="w-4 h-3 bg-brand-red-100 rounded"></div>
            <div className="w-4 h-3 bg-brand-red-300 rounded"></div>
            <div className="w-4 h-3 bg-brand-red-500 rounded"></div>
            <div className="w-4 h-3 bg-brand-red-700 rounded"></div>
            <span>More</span>
          </div>
        </Card>
        )}

        {/* 2) Mood by Shift (Pie charts) */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900">Mood by Shift</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <BarChart3 className="h-5 w-5 text-neutral-600" />
                </TooltipTrigger>
                <TooltipContent>
                  Mood distribution for start vs end shift responses.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Shift Pie */}
            <div className="h-80">
              <div className="text-center text-sm text-neutral-700 mb-2">Start Shift</div>
              <ResponsiveContainer width="100%" height="90%">
                <RechartsPieChart>
                  <Pie data={moodByShiftStartPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {moodByShiftStartPie.map((entry, index) => (
                      <Cell key={`start-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d: any = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg text-sm">
                          <div className="font-semibold mb-1">Start Shift</div>
                          <div className="flex items-center justify-between"><span>{d.name}</span><span className="font-medium">{d.value} · {d.pct}%</span></div>
                          <div className="mt-1 text-neutral-600">Total: {d.total}</div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            {/* End Shift Pie */}
            <div className="h-80">
              <div className="text-center text-sm text-neutral-700 mb-2">End Shift</div>
              <ResponsiveContainer width="100%" height="90%">
                <RechartsPieChart>
                  <Pie data={moodByShiftEndPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}>
                    {moodByShiftEndPie.map((entry, index) => (
                      <Cell key={`end-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d: any = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg text-sm">
                          <div className="font-semibold mb-1">End Shift</div>
                          <div className="flex items-center justify-between"><span>{d.name}</span><span className="font-medium">{d.value} · {d.pct}%</span></div>
                          <div className="mt-1 text-neutral-600">Total: {d.total}</div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* 3) Facility Response Leaderboard */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Top Facilities by Responses</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Users className="h-5 w-5 text-neutral-600" />
                </TooltipTrigger>
                <TooltipContent>
                  Facilities in scope ranked by number of responses.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {leaderboard.length === 0 ? (
            <div className="text-neutral-600 text-sm">No data in current scope.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-neutral-600">
                    <th className="py-2 pr-4">Facility</th>
                    <th className="py-2 pr-4">Responses</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map(row => (
                    <tr key={row.id} className="border-t border-neutral-200">
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2 pr-4 font-medium text-neutral-900">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
