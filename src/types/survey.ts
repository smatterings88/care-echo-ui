export interface SurveyResponse {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  agencyId: string;
  agencyName: string;
  userRole: 'admin' | 'manager' | 'agency' | 'user';
  surveyType: 'start' | 'end';
  responses: {
    mood: string;
    mainConcern: string;
    mainConcernOther?: string;
    support: string;
  };
  reflection: string; // The generated response message
  completedAt: Date;
  createdAt: Date;
}

export interface SurveyAnalytics {
  totalResponses: number;
  responsesByType: {
    start: number;
    end: number;
  };
  responsesByMood: {
    great: number;
    okay: number;
    tired: number;
    stressed: number;
    overwhelmed: number;
  };
  responsesByConcern: {
    'Resident grief or decline': number;
    'Family conflict': number;
    'Workload / understaffing': number;
    'Supervisor or leadership issues': number;
    'Personal / outside stress': number;
    'Other': number;
  };
  averageSupportLength: number;
  recentTrends: {
    date: string;
    count: number;
    averageMood: number; // 1-5 scale
  }[];
}

export interface SurveyFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  surveyType?: 'start' | 'end';
  agencyId?: string;
  agencyIds?: string[]; // For managers with multiple agencies
  userRole?: 'admin' | 'manager' | 'agency' | 'user';
  mood?: string;
  concern?: string;
}
