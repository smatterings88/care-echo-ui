import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  connectAuthEmulator
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserData, UserRole, AuthState, LoginCredentials, CreateUserData, CreateAgencyData, AgencyData } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  createUser: (userData: CreateUserData) => Promise<void>;
  createAgency: (agencyData: CreateAgencyData) => Promise<AgencyData>;
  updateUser: (uid: string, updates: Partial<UserData>) => Promise<void>;
  getUsersByAgency: (agencyId: string) => Promise<UserData[]>;
  getAllUsers: () => Promise<UserData[]>;
  getAgencies: () => Promise<AgencyData[]>;
  hasPermission: (requiredRole: UserRole) => boolean;
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

    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('Auth state changed:', { 
        firebaseUser: firebaseUser?.email, 
        isCreatingUser, 
        isCreatingUserRef: isCreatingUserRef.current,
        adminUserToRestore: adminUserToRestore?.email 
      });
      
      // Skip auth state changes when creating a user to prevent admin logout
      if (isCreatingUser || isCreatingUserRef.current) {
        console.log('Skipping auth state change - creating user');
        return;
      }

      // If we have an admin user to restore and Firebase Auth is null, restore the admin
      if (!firebaseUser && adminUserToRestore) {
        console.log('Restoring admin user:', adminUserToRestore.email);
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
            console.log('Firestore error, creating temporary user data');
          }

          if (!userData) {
            // Create a temporary user object if Firestore data doesn't exist
            // Default to 'user' role for new users (not admin)
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
        });
      } catch (firestoreError) {
        console.log('Could not update last login time in Firestore');
      }
      
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Login failed' 
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        error: error.message || 'Logout failed' 
      }));
      throw error;
    }
  };

  const createUser = async (userData: CreateUserData) => {
    // Store the current admin user info before creating new user
    const currentAdminUser = state.user;
    const currentAdminEmail = currentAdminUser?.email;
    
    console.log('Current admin user:', currentAdminEmail);
    
    if (!currentAdminEmail) {
      throw new Error('No current user found');
    }

    try {
      // Validate that agency is assigned for all users except admins
      if (!userData.agencyId && userData.role !== 'admin') {
        throw new Error('Agency assignment is required for all users except admins');
      }

      // Set flag to prevent auth state changes during user creation
      console.log('Setting isCreatingUser to true');
      setIsCreatingUser(true);
      isCreatingUserRef.current = true;
      
      // Create Firebase Auth user (this will automatically sign in the new user)
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // Update display name in Firebase Auth
      await updateProfile(userCredential.user, {
        displayName: userData.displayName,
      });

      try {
        // Create user document in Firestore
        const userDoc: UserData = {
          uid: userCredential.user.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          agencyId: userData.agencyId,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true,
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

        // If user is associated with an agency, update agency user count
        if (userData.agencyId) {
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

    } catch (error: any) {
      console.error('Error during user creation:', error);
      throw new Error(error.message || 'Failed to create user');
    } finally {
      // Always clean up auth state, even if there was an error
      try {
        // Sign out the newly created user (they shouldn't be logged in)
        console.log('Signing out newly created user');
        await auth.signOut();
        
        // Set the admin user to restore when Firebase Auth becomes null
        if (currentAdminUser) {
          console.log('Setting admin user to restore:', currentAdminUser.email);
          setAdminUserToRestore(currentAdminUser);
        }
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
      
      // Re-enable auth state changes
      console.log('Setting isCreatingUser to false');
      setIsCreatingUser(false);
      isCreatingUserRef.current = false;
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
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create agency');
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
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update user');
    }
  };

  const getUsersByAgency = async (agencyId: string): Promise<UserData[]> => {
    try {
      const q = query(collection(db, 'users'), where('agencyId', '==', agencyId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserData);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch users');
    }
  };

  const getAllUsers = async (): Promise<UserData[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      return querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      } as UserData));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch all users');
    }
  };

  const getAgencies = async (): Promise<AgencyData[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'agencies'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AgencyData[];
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch agencies');
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!state.user) return false;
    
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      agency: 2,
      admin: 3,
    };

    return roleHierarchy[state.user.role] >= roleHierarchy[requiredRole];
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
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
