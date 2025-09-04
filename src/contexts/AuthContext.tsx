import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  connectAuthEmulator,
  getAuth
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  documentId
} from 'firebase/firestore';
import { auth, db, getSecondaryApp } from '@/lib/firebase';
import { UserData, UserRole, AuthState, LoginCredentials, CreateUserData, CreateAgencyData, AgencyData } from '@/types/auth';
import { SurveyResponse, SurveyAnalytics, SurveyFilters } from '@/types/survey';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  createUser: (userData: CreateUserData) => Promise<void>;
  createAgency: (agencyData: CreateAgencyData) => Promise<AgencyData>;
  updateUser: (uid: string, updates: Partial<UserData>) => Promise<void>;
  getUsersByAgency: (agencyId: string) => Promise<UserData[]>;
  getAllUsers: () => Promise<UserData[]>;
  getAgencies: () => Promise<AgencyData[]>;
  getAgenciesByIds: (ids: string[]) => Promise<AgencyData[]>;
  getUsersByAgencyIds: (ids: string[]) => Promise<UserData[]>;
  hasPermission: (requiredRole: UserRole) => boolean;
  deleteUser: (uid: string) => Promise<void>;
  // Survey functions
  submitSurveyResponse: (surveyData: Omit<SurveyResponse, 'id' | 'createdAt'>) => Promise<void>;
  getSurveyResponses: (filters?: SurveyFilters) => Promise<SurveyResponse[]>;
  getSurveyAnalytics: (filters?: SurveyFilters) => Promise<SurveyAnalytics>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [adminUserToRestore, setAdminUserToRestore] = useState<UserData | null>(null);
  const isCreatingUserRef = useRef(false);
  const shouldIgnoreAuthChanges = useRef(false);
  const authListenerRef = useRef<(() => void) | null>(null);

    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Skip auth state changes when creating a user to prevent admin logout
      if (isCreatingUser || isCreatingUserRef.current || shouldIgnoreAuthChanges.current) {
        return;
      }

      // If we have an admin user to restore and Firebase Auth is null, restore the admin
      if (!firebaseUser && adminUserToRestore) {
        setState({
          user: adminUserToRestore,
          loading: false,
          error: null,
        });
        setAdminUserToRestore(null);
        return;
      }

      if (firebaseUser) {
        try {
          // Try to get user data from Firestore first
          let userData: UserData | null = null;
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              userData = userDoc.data() as UserData;
            }
          } catch (firestoreError) {
            // Firestore error, creating temporary user data
          }

          if (!userData) {
            // Create a temporary user object if Firestore data doesn't exist
            // Default to 'user' role for new users (not super_admin)
            userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: 'user', // Default to user role for new users
              createdAt: new Date(),
              lastLoginAt: new Date(),
              isActive: true,
            };
          }

          setState({
            user: userData,
            loading: false,
            error: null,
          });

          // Activity tracking: mark lastActiveAt now
          try {
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastActiveAt: serverTimestamp(),
            });
          } catch {}

        } catch (error) {
          console.error('Auth error:', error);
          setState({
            user: null,
            loading: false,
            error: 'Failed to load user data',
          });
        }
      } else {
        setState({
          user: null,
          loading: false,
          error: null,
        });
      }
    });

    // Store the unsubscribe function
    authListenerRef.current = unsubscribe;
    
    return unsubscribe;
  }, [isCreatingUser, adminUserToRestore]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      
      // Try to update last login time in Firestore
      try {
        await updateDoc(doc(db, 'users', userCredential.user.uid), {
          lastLoginAt: serverTimestamp(),
          loginCount: (await getDoc(doc(db, 'users', userCredential.user.uid))).data()?.loginCount + 1 || 1,
        });
      } catch (firestoreError) {
        // Could not update last login time in Firestore
      }
      
    } catch (error: unknown) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: unknown) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      }));
      throw error;
    }
  };

  const createUser = async (userData: CreateUserData) => {
    // Store the current admin user info before creating new user
    const currentAdminUser = state.user;
    const currentAdminEmail = currentAdminUser?.email;
    
    if (!currentAdminEmail) {
      throw new Error('No current user found');
    }

    try {
      // Validate that agency is assigned for all users except admins
      if (userData.role === 'org_admin') {
        // Org_admins need at least one agency assigned
        if (!userData.agencyIds || userData.agencyIds.length === 0) {
          throw new Error('Agency assignment is required for org_admins');
        }
      } else if (userData.role !== 'super_admin') {
        // Other users (except super_admins) need a single agency assigned
        if (!userData.agencyId) {
          throw new Error('Agency assignment is required for all users except super_admins');
        }
      }

      // Set flags to prevent auth state changes during user creation
      setIsCreatingUser(true);
      isCreatingUserRef.current = true;
      shouldIgnoreAuthChanges.current = true;
      
      // Temporarily unsubscribe from auth state changes
      if (authListenerRef.current) {
        authListenerRef.current();
        authListenerRef.current = null;
      }
      
      // Use secondary auth instance so current session is not affected
      const secondaryAuth = getAuth(getSecondaryApp());
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email, userData.password);
      
      // Update display name in Firebase Auth
      await updateProfile(userCredential.user, {
        displayName: userData.displayName,
      });

      try {
        // Create user document in Firestore
        const baseDoc = {
          uid: userCredential.user.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role as UserRole,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true,
        } as Partial<UserData>;

        const withAgencyId = userData.agencyId ? { agencyId: userData.agencyId } : {};
        const withAgencyIds = (userData.role === 'org_admin' && userData.agencyIds && userData.agencyIds.length > 0)
          ? { agencyIds: userData.agencyIds }
          : {};

        const userDoc = { ...baseDoc, ...withAgencyId, ...withAgencyIds } as UserData;

        await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

        // If user is associated with agencies, update agency user counts
        if (userData.role === 'org_admin' && userData.agencyIds) {
          // For org_admins, update user count for all assigned agencies
          for (const agencyId of userData.agencyIds) {
            const agencyRef = doc(db, 'agencies', agencyId);
            const agencyDoc = await getDoc(agencyRef);
            if (agencyDoc.exists()) {
              await updateDoc(agencyRef, {
                userCount: (agencyDoc.data()?.userCount || 0) + 1,
              });
            }
          }
        } else if (userData.agencyId) {
          // For regular users, update user count for single agency
          const agencyRef = doc(db, 'agencies', userData.agencyId);
          const agencyDoc = await getDoc(agencyRef);
          if (agencyDoc.exists()) {
            await updateDoc(agencyRef, {
              userCount: (agencyDoc.data()?.userCount || 0) + 1,
            });
          }
        }
      } catch (firestoreError) {
        console.error('Firestore error during user creation:', firestoreError);
        // Even if Firestore fails, we need to clean up the auth state
        // The user was created in Firebase Auth but not in Firestore
        throw new Error('Failed to create user in database. Please check Firestore permissions.');
      }

    } catch (error: unknown) {
      console.error('Error during user creation:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      // Always clean up auth state, even if there was an error
      try {
        // Sign out the newly created user (they shouldn't be logged in)
        try {
          const secondary = getAuth(getSecondaryApp());
          await signOut(secondary);
        } catch {}
        
        // Manually restore the admin session
        if (currentAdminUser) {
          setState({
            user: currentAdminUser,
            loading: false,
            error: null,
          });
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
      
      // Re-enable auth state changes
      setIsCreatingUser(false);
      isCreatingUserRef.current = false;
      shouldIgnoreAuthChanges.current = false;
      
      // Resubscribe to auth state changes
      const newUnsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        // Skip auth state changes when creating a user to prevent admin logout
        if (isCreatingUser || isCreatingUserRef.current || shouldIgnoreAuthChanges.current) {
          return;
        }

        // If we have an admin user to restore and Firebase Auth is null, restore the admin
        if (!firebaseUser && adminUserToRestore) {
          setState({
            user: adminUserToRestore,
            loading: false,
            error: null,
          });
          setAdminUserToRestore(null);
          return;
        }

        if (firebaseUser) {
          try {
            // Try to get user data from Firestore first
            let userData: UserData | null = null;
            try {
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              if (userDoc.exists()) {
                userData = userDoc.data() as UserData;
              }
                      } catch (firestoreError) {
            // Firestore error, creating temporary user data
          }

            if (!userData) {
              // Create a temporary user object if Firestore data doesn't exist
              // Default to 'user' role for new users (not super_admin)
              userData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'User',
                role: 'user', // Default to user role for new users
                createdAt: new Date(),
                lastLoginAt: new Date(),
                isActive: true,
              };
            }

            setState({
              user: userData,
              loading: false,
              error: null,
            });
          } catch (error) {
            console.error('Auth error:', error);
            setState({
              user: null,
              loading: false,
              error: 'Failed to load user data',
            });
          }
        } else {
          setState({
            user: null,
            loading: false,
            error: null,
          });
        }
      });
      
      authListenerRef.current = newUnsubscribe;
    }
  };

  const createAgency = async (agencyData: CreateAgencyData): Promise<AgencyData> => {
    try {
      const agencyRef = await addDoc(collection(db, 'agencies'), {
        name: agencyData.name,
        adminId: agencyData.adminId,
        createdAt: serverTimestamp(),
        isActive: true,
        userCount: 0,
      });

      // Return the full agency data
      return {
        id: agencyRef.id,
        name: agencyData.name,
        adminId: agencyData.adminId,
        createdAt: new Date(),
        isActive: true,
        userCount: 0,
      };
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create agency');
    }
  };

  const updateUser = async (uid: string, updates: Partial<UserData>) => {
    try {
      await updateDoc(doc(db, 'users', uid), updates);
      
      // Update local state if it's the current user
      if (state.user?.uid === uid) {
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, ...updates } : null,
        }));
      }
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const deleteUser = async (uid: string) => {
    // Only allow if current user has admin permission via rules; here we attempt and surface errors
    try {
      await deleteDoc(doc(db, 'users', uid));
      // Optimistically update local state
      setState(prev => prev); // no local change to current user
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const getUsersByAgency = async (agencyId: string): Promise<UserData[]> => {
    try {
      const q = query(collection(db, 'users'), where('agencyId', '==', agencyId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserData);
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  };

  const getAllUsers = async (): Promise<UserData[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      } as UserData));
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch all users');
    }
  };

  const getAgencies = async (): Promise<AgencyData[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'agencies'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AgencyData[];
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch agencies');
    }
  };

  const getAgenciesByIds = async (ids: string[]): Promise<AgencyData[]> => {
    try {
      if (!ids || ids.length === 0) return [];
      // Firestore 'in' has a max of 10 elements - chunk if needed
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
      const results: AgencyData[] = [];
      for (const chunk of chunks) {
        const qRef = query(collection(db, 'agencies'), where(documentId(), 'in', chunk));
        const qs = await getDocs(qRef);
        results.push(
          ...qs.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as AgencyData[]
        );
      }
      return results;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch agencies by ids');
    }
  };

  const getUsersByAgencyIds = async (ids: string[]): Promise<UserData[]> => {
    try {
      if (!ids || ids.length === 0) return [];
      // 'in' max 10 - chunk
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
      const all: UserData[] = [];
      for (const chunk of chunks) {
        const qRef = query(collection(db, 'users'), where('agencyId', 'in', chunk));
        const qs = await getDocs(qRef);
        all.push(
          ...qs.docs.map(d => ({ uid: d.id, ...(d.data() as any) })) as UserData[]
        );
      }
      return all;
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch users by agency ids');
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!state.user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      site_admin: 2,
      org_admin: 3,
      super_admin: 4,
    };

    const userLevel = roleHierarchy[state.user.role];
    const requiredLevel = roleHierarchy[requiredRole];
    const hasAccess = userLevel >= requiredLevel;

    console.log('hasPermission Debug:', {
      userRole: state.user.role,
      userLevel,
      requiredRole,
      requiredLevel,
      hasAccess,
      userEmail: state.user.email
    });

    return hasAccess;
  };

  // Survey functions
  const submitSurveyResponse = async (surveyData: Omit<SurveyResponse, 'id' | 'createdAt'>) => {
    try {
      const surveyRef = await addDoc(collection(db, 'surveys'), {
        ...surveyData,
        createdAt: serverTimestamp(),
      });
      // Update lastActiveAt upon activity
      if (state.user?.uid) {
        try { await updateDoc(doc(db, 'users', state.user.uid), { lastActiveAt: serverTimestamp() }); } catch {}
      }
              // Survey response saved successfully
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to submit survey response');
    }
  };

  const getSurveyResponses = async (filters?: SurveyFilters): Promise<SurveyResponse[]> => {
    try {
      let q: any = collection(db, 'surveys');
      
      // Apply filters
      if (filters?.dateRange) {
        q = query(q, 
          where('completedAt', '>=', filters.dateRange.start),
          where('completedAt', '<=', filters.dateRange.end)
        );
      }
      
      if (filters?.surveyType) {
        q = query(q, where('surveyType', '==', filters.surveyType));
      }
      
      if (filters?.agencyId) {
        q = query(q, where('agencyId', '==', filters.agencyId));
      } else if (filters?.agencyIds && filters.agencyIds.length > 0) {
        // For managers with multiple agencies
        q = query(q, where('agencyId', 'in', filters.agencyIds));
      }
      
      if (filters?.userRole) {
        q = query(q, where('userRole', '==', filters.userRole));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<SurveyResponse, 'id'>),
      })) as SurveyResponse[];
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch survey responses');
    }
  };

  const getSurveyAnalytics = async (filters?: SurveyFilters): Promise<SurveyAnalytics> => {
    try {
      const responses = await getSurveyResponses(filters);
      
      // Calculate analytics
      const totalResponses = responses.length;
      const responsesByType = {
        start: responses.filter(r => r.surveyType === 'start').length,
        end: responses.filter(r => r.surveyType === 'end').length,
      };
      
      const responsesByMood = {
        great: responses.filter(r => r.responses.mood === 'great').length,
        okay: responses.filter(r => r.responses.mood === 'okay').length,
        tired: responses.filter(r => r.responses.mood === 'tired').length,
        stressed: responses.filter(r => r.responses.mood === 'stressed').length,
        overwhelmed: responses.filter(r => r.responses.mood === 'overwhelmed').length,
      };
      
      const responsesByConcern = {
        'Resident grief or decline': responses.filter(r => r.responses.mainConcern === 'Resident grief or decline').length,
        'Family conflict': responses.filter(r => r.responses.mainConcern === 'Family conflict').length,
        'Workload / understaffing': responses.filter(r => r.responses.mainConcern === 'Workload / understaffing').length,
        'Supervisor or leadership issues': responses.filter(r => r.responses.mainConcern === 'Supervisor or leadership issues').length,
        'Personal / outside stress': responses.filter(r => r.responses.mainConcern === 'Personal / outside stress').length,
        'Other': responses.filter(r => r.responses.mainConcern === 'Other').length,
      };
      
      const averageSupportLength = responses.length > 0 
        ? responses.reduce((sum, r) => sum + (r.responses.support?.length || 0), 0) / responses.length 
        : 0;
      
      // Calculate recent trends (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentResponses = responses.filter(r => r.completedAt >= sevenDaysAgo);
      const recentTrends = recentResponses.reduce((acc, response) => {
        const date = response.completedAt.toDateString();
        if (!acc[date]) {
          acc[date] = { count: 0, totalMood: 0 };
        }
        acc[date].count++;
        acc[date].totalMood += ['great', 'okay', 'tired', 'stressed', 'overwhelmed'].indexOf(response.responses.mood) + 1;
        return acc;
      }, {} as Record<string, { count: number; totalMood: number }>);
      
      const trends = Object.entries(recentTrends).map(([date, data]) => ({
        date,
        count: data.count,
        averageMood: data.totalMood / data.count,
      }));
      
      return {
        totalResponses,
        responsesByType,
        responsesByMood,
        responsesByConcern,
        averageSupportLength,
        recentTrends: trends,
      };
    } catch (error: unknown) {
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch survey analytics');
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    createUser,
    createAgency,
    updateUser,
    getUsersByAgency,
    getAllUsers,
    getAgencies,
    getAgenciesByIds,
    getUsersByAgencyIds,
    hasPermission,
    deleteUser,
    submitSurveyResponse,
    getSurveyResponses,
    getSurveyAnalytics,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
