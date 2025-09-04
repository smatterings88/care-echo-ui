export type UserRole = 'super_admin' | 'org_admin' | 'site_admin' | 'user';

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  agencyId?: string; // Required for users, optional for agency/admins
  agencyIds?: string[]; // For managers - multiple agencies
  agencyName?: string; // For users to see their agency name
  agencyNames?: string[]; // For managers - multiple agency names
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
  agencyIds?: string[]; // For managers
}

export interface CreateAgencyData {
  name: string;
  adminId: string;
}
