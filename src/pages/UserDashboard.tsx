import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Sun, Moon, LogOut } from 'lucide-react';

const UserDashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 px-4 py-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 rounded-full p-3 transition-all duration-200"
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
            <div className="w-12 h-12 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Sun className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Date */}
          <div className="text-amber-600/70 text-caption mb-2 tracking-wider">
            {getDayOfWeek(new Date())} {getFormattedDate(new Date())}
          </div>

          {/* Greeting */}
          <h1 className="text-h1 text-amber-900/90 mb-8">
            {getGreeting()}, {getFirstName()}!
          </h1>

          {/* Calendar */}
          <div className="bg-white/30 backdrop-blur-xl rounded-3xl p-6 shadow-xl border border-white/20 max-w-md mx-auto">
            <div className="text-center mb-4">
              <h3 className="text-h3 text-amber-900">
                This Week
              </h3>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-caption text-amber-700/70 py-2">
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
                      ? 'bg-amber-500 text-white shadow-lg scale-110'
                      : 'text-amber-700'
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
          <Card className="group bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={handleStartShift}>
            <div className="text-center">
              <div className="text-red-500 text-cta mb-4 tracking-wide">
                START SHIFT
              </div>
              
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Sun className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="relative mb-6">
                <h2 className="text-h2 text-amber-900/90 mb-4">
                  Morning
                </h2>
                
                <div className="text-quote text-amber-900/90">
                  reflection
                </div>
              </div>

              <div className="text-amber-700/70 text-caption">
                Start your perfect day
              </div>
            </div>
          </Card>

          {/* End Shift Card */}
          <Card className="group bg-white/20 backdrop-blur-xl border border-white/30 rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                onClick={handleEndShift}>
            <div className="text-center">
              <div className="text-red-500 text-cta mb-4 tracking-wide">
                END SHIFT
              </div>
              
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Moon className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="relative mb-6">
                <h2 className="text-h2 text-amber-900/90 mb-4">
                  Evening
                </h2>
                
                <div className="text-quote text-amber-900/90">
                  reflection
                </div>
              </div>

              <div className="text-amber-700/70 text-caption">
                Assess your day
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-amber-600/60 text-caption">
            Take a moment to reflect on your shift
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
