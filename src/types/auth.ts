export type UserRole = 'admin' | 'agency' | 'user';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  agencyId?: string; // Required for users, optional for agency/admins
  agencyName?: string; // For users to see their agency name
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}

export interface AgencyData {
  id: string;
  name: string;
  adminId: string; // The admin who created this agency
  createdAt: Date;
  isActive: boolean;
  userCount: number;
}

export interface AuthState {
  user: UserData | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  agencyId?: string;
}

export interface CreateAgencyData {
  name: string;
  adminId: string;
}
