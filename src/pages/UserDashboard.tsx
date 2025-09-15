import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Sun, Moon, LogOut, Check, Flame } from 'lucide-react';

const UserDashboard = () => {
  const { user, logout, getSurveyCompletionStatus, getContinuousDaysCount } = useAuth();
  const [surveyStatus, setSurveyStatus] = useState({ start: false, end: false });
  const [continuousDays, setContinuousDays] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Fetch survey completion status for today and continuous days count
  useEffect(() => {
    const fetchSurveyData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        const [status, continuousDaysCount] = await Promise.all([
          getSurveyCompletionStatus(user.uid, today),
          getContinuousDaysCount(user.uid)
        ]);
        setSurveyStatus(status);
        setContinuousDays(continuousDaysCount);
      } catch (error) {
        console.error('Error fetching survey data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSurveyData();
  }, [user?.uid, getSurveyCompletionStatus, getContinuousDaysCount]);
  // Get current day of week and date
  const getDayOfWeek = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  };

  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).toUpperCase();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get calendar days for current week
  const getCalendarDays = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay + 1); // Start from Monday
    
    const days = [];
    
    // Get 7 days starting from Monday
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const isToday = (day: Date) => {
    const today = new Date();
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    );
  };

  const getFirstName = () => {
    if (user?.firstName) return user.firstName;
    if (user?.displayName) return user.displayName.split(' ')[0];
    return 'User';
  };

  const handleStartShift = () => {
    // Navigate to start shift survey
    window.location.href = '/survey?type=start';
  };

  const handleEndShift = () => {
    // Navigate to end shift survey
    window.location.href = '/survey?type=end';
  };

  const calendarDays = getCalendarDays();
  const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-brand-red-500/10 to-accent-teal/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent-teal/10 to-brand-red-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 px-4 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-full p-3 transition-all duration-200 focus-ring"
          >
            <LogOut className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
          
          {/* Spacer to center the content */}
          <div className="flex-1"></div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-brand-red-600 to-brand-red-700 rounded-full flex items-center justify-center shadow-lg">
              <Sun className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Date */}
          <div className="text-neutral-600 text-caption mb-2 tracking-wider">
            {getDayOfWeek(new Date())} {getFormattedDate(new Date())}
          </div>

          {/* Greeting */}
          <h1 className="text-h1 text-neutral-900 mb-6">
            {getGreeting()}, {getFirstName()}!
          </h1>

          {/* Continuous Days Counter */}
          {continuousDays > 0 && (
            <div className="mb-8">
              <Card className="bg-gradient-to-r from-brand-red-600 to-brand-red-700 text-white rounded-3xl p-6 shadow-2xl max-w-sm mx-auto border border-brand-red-500/20">
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-h1 font-bold text-white">{continuousDays}</div>
                    <div className="text-caption text-white/90 tracking-wide">
                      {continuousDays === 1 ? 'DAY' : 'DAYS'} STREAK
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3 text-caption text-white/80 tracking-wider">
                  Both surveys completed daily
                </div>
              </Card>
            </div>
          )}

          {/* Calendar */}
          <div className="bg-neutral-100/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-neutral-200 max-w-md mx-auto">
            <div className="text-center mb-4">
              <h3 className="text-h3 text-neutral-900">
                This Week
              </h3>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-caption text-neutral-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`aspect-square flex items-center justify-center text-sm font-medium rounded-xl transition-all duration-200 ${
                    isToday(day)
                      ? 'bg-brand-red-600 text-white shadow-lg scale-110'
                      : 'text-neutral-700'
                  }`}
                >
                  {day.getDate()}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Start Shift Card */}
          <Card className={`group card-interactive rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] cursor-pointer focus-ring relative ${
            surveyStatus.start ? 'ring-2 ring-brand-red-600 bg-brand-red-600/5' : ''
          }`}
                onClick={handleStartShift}>
            {/* Check mark overlay */}
            {surveyStatus.start && (
              <div className="absolute top-4 right-4 w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div className="text-center">
              <div className="text-brand-red-600 text-cta mb-4 tracking-wide">
                START SHIFT
              </div>
              
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-brand-red-600 to-brand-red-700 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Sun className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="relative mb-6">
                <h2 className="text-h2 text-neutral-900 mb-4">
                  Ready to begin?
                </h2>
                
                <div className="text-quote text-neutral-800">
                  How are you feeling as you start your shift today— energized, uncertain, or somewhere in between?
                </div>
              </div>

              <div className="text-neutral-600 text-caption">
                {surveyStatus.start ? 'Completed today' : 'Start your perfect day'}
              </div>
            </div>
          </Card>

          {/* End Shift Card */}
          <Card className={`group card-interactive rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] cursor-pointer focus-ring relative ${
            surveyStatus.end ? 'ring-2 ring-brand-red-600 bg-brand-red-600/5' : ''
          }`}
                onClick={handleEndShift}>
            {/* Check mark overlay */}
            {surveyStatus.end && (
              <div className="absolute top-4 right-4 w-8 h-8 bg-brand-red-600 rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div className="text-center">
              <div className="text-brand-red-600 text-cta mb-4 tracking-wide">
                END SHIFT
              </div>
              
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent-teal to-brand-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Moon className="w-8 h-8 text-neutral-900" />
                </div>
              </div>

              <div className="relative mb-6">
                <h2 className="text-h2 text-neutral-900 mb-4">
                  Shift's over.
                </h2>
                
                <div className="text-quote text-neutral-800">
                  Looking back, was it a rough one, a good one, or somewhere in between? Share how you're doing.
                </div>
              </div>

              <div className="text-neutral-600 text-caption">
                {surveyStatus.end ? 'Completed today' : 'Assess your day'}
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-neutral-600 text-caption">
            Take a moment to reflect on your shift
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
