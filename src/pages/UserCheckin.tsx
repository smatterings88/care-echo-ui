import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Search, Calendar, Clock, TrendingUp, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import md5 from 'crypto-js/md5';

interface UserSurveyStats {
  userId: string;
  userEmail: string;
  userDisplayName: string;
  userRole: string;
  agencyId?: string;
  agencyName?: string;
  totalStartSurveys: number;
  totalEndSurveys: number;
  lastSurveyDate?: Date;
  recentMoodTrend: string;
}

interface SurveyLog {
  id: string;
  surveyType: 'start' | 'end';
  responses: {
    mood: string;
    mainConcern: string;
    mainConcernOther?: string;
    support: string;
  };
  reflection: string;
  completedAt: Date;
}

const UserCheckin = () => {
  const { user, getAllUsers, getUsersByAgencyIds, getSurveyResponses, getAgencies, getAgenciesByIds } = useAuth();
  const [users, setUsers] = useState<UserSurveyStats[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSurveyStats[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [facilities, setFacilities] = useState<{ id: string; name: string }[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserSurveyStats | null>(null);
  const [userSurveyLogs, setUserSurveyLogs] = useState<SurveyLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Normalize Firestore Timestamp/Date/string to Date
  const getSurveyDate = (survey: any): Date | null => {
    const raw = survey?.completedAt || survey?.createdAt;
    if (!raw) return null;
    if (typeof raw?.toDate === 'function') return raw.toDate();
    if (raw instanceof Date) return raw;
    const parsed = new Date(raw);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Generate Gravatar URL from email
  const getGravatarUrl = (email: string) => {
    const hash = md5(email.toLowerCase().trim()).toString();
    return `https://www.gravatar.com/avatar/${hash}?d=mp&s=200`;
  };

  // Get user initials for avatar fallback
  const getUserInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get mood trend based on recent surveys
  const getMoodTrend = (recentMoods: string[]) => {
    if (recentMoods.length === 0) return 'No recent data';
    
    const moodScores = recentMoods.map(mood => {
      switch (mood) {
        case 'great': return 5;
        case 'okay': return 4;
        case 'tired': return 3;
        case 'stressed': return 2;
        case 'overwhelmed': return 1;
        default: return 3;
      }
    });
    
    const average = moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length;
    
    if (average >= 4.5) return 'Excellent';
    if (average >= 3.5) return 'Good';
    if (average >= 2.5) return 'Fair';
    if (average >= 1.5) return 'Poor';
    return 'Concerning';
  };

  // Load users and their survey statistics
  useEffect(() => {
    const loadUsers = async () => {
      if (!user) return;

      // Check if user has permission to access this page
      if (!['super_admin', 'org_admin', 'site_admin'].includes(user.role)) {
        console.error('User does not have permission to access user check-in data');
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let usersToLoad: any[] = [];

        // Get users based on admin role
        if (user.role === 'super_admin') {
          // Super admin can see all users
          console.log('Loading all users for super admin');
          usersToLoad = await getAllUsers();
        } else if (user.role === 'org_admin' && user.agencyIds && user.agencyIds.length > 0) {
          // Org admin can see users from their assigned agencies
          console.log('Loading users for org admin from agencies:', user.agencyIds);
          usersToLoad = await getUsersByAgencyIds(user.agencyIds);
        } else if (user.role === 'site_admin' && user.agencyId) {
          // Site admin can see users from their agency
          console.log('Loading users for site admin from agency:', user.agencyId);
          usersToLoad = await getUsersByAgencyIds([user.agencyId]);
        } else {
          // No valid scope - return empty array
          console.log('No valid scope for user role:', user.role);
          usersToLoad = [];
        }

        console.log(`Loaded ${usersToLoad.length} users for ${user.role}`);

        // Filter to only show regular users (role === 'user')
        // Normalize role to handle undefined/mixed-case values
        console.log('All users loaded (id, role):', usersToLoad.map(u => ({ id: u.uid, role: u.role })));
        const regularUsers = usersToLoad.filter(userData => (
          (userData.role ? String(userData.role).trim().toLowerCase() : 'user') === 'user'
        ));
        console.log(`Filtered to ${regularUsers.length} regular users`, regularUsers.map(u => u.uid));

        // Get survey statistics for each regular user
        const userStats: UserSurveyStats[] = [];
        
        for (const userData of regularUsers) {
          let userSurveys: any[] = [];
          try {
            // Get all surveys for this specific user
            const surveys = await getSurveyResponses();
            // Filter surveys for this specific user
            userSurveys = surveys
              .filter(survey => survey.userId === userData.uid)
              .map(s => ({ ...s, completedAt: getSurveyDate(s) || new Date(0) }));
          } catch (error) {
            console.error(`Error loading surveys for user ${userData.uid}:`, error);
            // Fallback: show user with zeroed stats
            userSurveys = [];
          }

          const startSurveys = userSurveys.filter(s => s.surveyType === 'start');
          const endSurveys = userSurveys.filter(s => s.surveyType === 'end');

          // Get recent moods for trend analysis
          const recentSurveys = userSurveys
            .sort((a, b) => (b.completedAt?.getTime?.() || 0) - (a.completedAt?.getTime?.() || 0))
            .slice(0, 5);
          const recentMoods = recentSurveys.map(s => s.responses.mood);

          const lastSurvey = userSurveys.length > 0 
            ? userSurveys.sort((a, b) => (b.completedAt?.getTime?.() || 0) - (a.completedAt?.getTime?.() || 0))[0]
            : null;

          userStats.push({
            userId: userData.uid,
            userEmail: userData.email,
            userDisplayName: userData.displayName || 'Unknown User',
            userRole: userData.role,
            agencyId: userData.agencyId,
            agencyName: userData.agencyName,
            totalStartSurveys: startSurveys.length,
            totalEndSurveys: endSurveys.length,
            lastSurveyDate: lastSurvey?.completedAt || undefined,
            recentMoodTrend: getMoodTrend(recentMoods)
          });
        }

        setUsers(userStats);
        setFilteredUsers(userStats);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [user, getUsersByAgencyIds, getSurveyResponses]);

  // Load facilities (agencies) based on admin scope
  useEffect(() => {
    const loadFacilities = async () => {
      if (!user) return;
      try {
        if (user.role === 'super_admin') {
          const all = await getAgencies();
          setFacilities(all.map(a => ({ id: a.id, name: a.name })));
        } else if (user.role === 'org_admin' && user.agencyIds && user.agencyIds.length > 0) {
          const scoped = await getAgenciesByIds(user.agencyIds);
          setFacilities(scoped.map(a => ({ id: a.id, name: a.name })));
        } else if (user.role === 'site_admin' && user.agencyId) {
          const scoped = await getAgenciesByIds([user.agencyId]);
          setFacilities(scoped.map(a => ({ id: a.id, name: a.name })));
        } else {
          setFacilities([]);
        }
      } catch (e) {
        setFacilities([]);
      }
    };
    loadFacilities();
  }, [user, getAgencies, getAgenciesByIds]);

  // Filter users based on search term
  useEffect(() => {
    let list = users;
    // Facility filter first
    if (selectedFacilityId !== 'all') {
      list = list.filter(u => u.agencyId === selectedFacilityId);
    }
    // Then search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(u => 
        u.userDisplayName.toLowerCase().includes(term) ||
        u.userEmail.toLowerCase().includes(term) ||
        (u.agencyName && u.agencyName.toLowerCase().includes(term))
      );
    }
    setFilteredUsers(list);
  }, [searchTerm, users, selectedFacilityId]);

  // Load detailed survey logs for selected user
  const loadUserSurveyLogs = async (selectedUser: UserSurveyStats) => {
    try {
      const surveys = await getSurveyResponses();
      
      const userSurveys = surveys
        .filter(survey => survey.userId === selectedUser.userId)
        .map(s => ({ ...s, completedAt: (typeof (s as any)?.completedAt?.toDate === 'function' ? (s as any).completedAt.toDate() : (s as any).completedAt instanceof Date ? (s as any).completedAt : new Date((s as any).completedAt || 0)) }))
        .sort((a, b) => (b.completedAt?.getTime?.() || 0) - (a.completedAt?.getTime?.() || 0));
      
      setUserSurveyLogs(userSurveys);
    } catch (error) {
      console.error('Error loading user survey logs:', error);
    }
  };

  const handleUserClick = (selectedUser: UserSurveyStats) => {
    setSelectedUser(selectedUser);
    loadUserSurveyLogs(selectedUser);
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'great': return '😃';
      case 'okay': return '🙂';
      case 'tired': return '😐';
      case 'stressed': return '😔';
      case 'overwhelmed': return '😢';
      default: return '😐';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'great': return 'text-green-600 bg-green-100';
      case 'okay': return 'text-blue-600 bg-blue-100';
      case 'tired': return 'text-yellow-600 bg-yellow-100';
      case 'stressed': return 'text-orange-600 bg-orange-100';
      case 'overwhelmed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'Excellent': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      case 'Fair': return 'text-yellow-600 bg-yellow-100';
      case 'Poor': return 'text-orange-600 bg-orange-100';
      case 'Concerning': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-600 mx-auto mb-4"></div>
          <p className="text-neutral-700">Loading user check-in data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full border-b border-neutral-200 bg-neutral-100/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" asChild className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 focus-ring">
              <Link to="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-h3 text-neutral-900">User Check-in</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!selectedUser ? (
          /* User List View */
          <div className="space-y-6">
            {/* Debug box removed per request */}

            {/* Search and Stats */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-2xl border-neutral-200 focus:border-brand-red-600 focus:ring-2 focus:ring-accent-teal"
                />
              </div>
              <div className="w-full sm:w-64">
                <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Filter by Facility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Facilities</SelectItem>
                    {facilities.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            <div className="text-sm text-neutral-600">
              {filteredUsers.length} regular user{filteredUsers.length !== 1 ? 's' : ''} found
              {user && (
                <span className="ml-2 text-xs text-neutral-500">
                  ({user.role === 'super_admin' ? 'All regular users' : 
                    user.role === 'org_admin' ? `Regular users from ${user.agencyIds?.length || 0} facilities` :
                    user.role === 'site_admin' ? `Regular users from ${user.agencyName || 'your facility'}` :
                    'No access'})
                </span>
              )}
            </div>
            </div>

            {/* Users Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((userData) => (
                <Card 
                  key={userData.userId}
                  className="card-interactive p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer focus-ring"
                  onClick={() => handleUserClick(userData)}
                >
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={getGravatarUrl(userData.userEmail)} 
                        alt={userData.userDisplayName}
                      />
                      <AvatarFallback className="bg-accent-teal text-white text-sm font-medium">
                        {getUserInitials(userData.userDisplayName)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-h3 text-neutral-900 truncate">{userData.userDisplayName}</h3>
                      <p className="text-body-sm text-neutral-600 truncate">{userData.userEmail}</p>
                      {userData.agencyName && (
                        <p className="text-caption text-neutral-500 truncate">{userData.agencyName}</p>
                      )}
                      
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={`text-xs ${getTrendColor(userData.recentMoodTrend)}`}>
                          Mood trend: {userData.recentMoodTrend}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {userData.userRole.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-h2 text-brand-red-600">{userData.totalStartSurveys}</div>
                      <div className="text-caption text-neutral-600">Start Surveys</div>
                    </div>
                    <div className="text-center">
                      <div className="text-h2 text-accent-teal">{userData.totalEndSurveys}</div>
                      <div className="text-caption text-neutral-600">End Surveys</div>
                    </div>
                  </div>

                  {userData.lastSurveyDate && (
                    <div className="mt-3 text-center">
                      <div className="text-caption text-neutral-500">
                        Last survey: {userData.lastSurveyDate.toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-h3 text-neutral-900 mb-2">No users found</h3>
                <p className="text-body text-neutral-600">
                  {searchTerm ? 'Try adjusting your search terms' : 'No users are available in your scope'}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* User Survey Logs View */
          <div className="space-y-6">
            {/* User Header */}
            <Card className="p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage 
                      src={getGravatarUrl(selectedUser.userEmail)} 
                      alt={selectedUser.userDisplayName}
                    />
                    <AvatarFallback className="bg-accent-teal text-white text-lg font-medium">
                      {getUserInitials(selectedUser.userDisplayName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-h2 text-neutral-900">{selectedUser.userDisplayName}</h2>
                    <p className="text-body text-neutral-600">{selectedUser.userEmail}</p>
                    {selectedUser.agencyName && (
                      <p className="text-caption text-neutral-500">{selectedUser.agencyName}</p>
                    )}
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedUser(null)}
                  className="focus-ring"
                >
                  Back to List
                </Button>
              </div>
            </Card>

            {/* Survey Logs */}
            <div className="space-y-4">
              <h3 className="text-h3 text-neutral-900">Survey History</h3>
              
              {userSurveyLogs.length === 0 ? (
                <Card className="p-8 text-center rounded-2xl">
                  <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <h4 className="text-h3 text-neutral-900 mb-2">No surveys found</h4>
                  <p className="text-body text-neutral-600">This user hasn't completed any surveys yet.</p>
                </Card>
              ) : (
                userSurveyLogs.map((survey) => (
                  <Card key={survey.id} className="p-6 rounded-2xl shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          variant="outline" 
                          className={
                            survey.surveyType === 'start'
                              ? 'border-brand-red-600 text-brand-red-700 bg-brand-red-50'
                              : 'border-accent-teal text-accent-teal bg-accent-teal/10'
                          }
                        >
                          {survey.surveyType === 'start' ? 'Start Shift' : 'End Shift'}
                        </Badge>
                      </div>
                      <div className="text-caption text-neutral-500 flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{survey.completedAt.toLocaleDateString()} at {survey.completedAt.toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCheckin;
