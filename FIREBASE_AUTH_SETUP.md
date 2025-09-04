# CareEcho Firebase Authentication System

## Overview
CareEcho implements a complete role-based authentication system using Firebase Authentication and Firestore for user management. The system supports three user roles with hierarchical permissions.

## User Roles & Permissions

### 🔴 Admin
- **Permissions**: Full system access
- **Can**: Create admin accounts, agency accounts, and user accounts
- **Can**: Perform account maintenance and system administration
- **Access**: All features and data

### 🔵 Agency
- **Permissions**: Agency-level management
- **Can**: Create user accounts within their agency
- **Can**: View and manage users in their agency
- **Access**: Agency dashboard and user management

### 🟢 User
- **Permissions**: Basic survey access
- **Can**: Login and take surveys
- **Must**: Be associated with an agency
- **Access**: Survey functionality only

## Firebase Configuration

### Project Details
- **Project ID**: `echocare-820f4`
- **Auth Domain**: `echocare-820f4.firebaseapp.com`
- **Storage Bucket**: `echocare-820f4.firebasestorage.app`

### Required Firebase Services
1. **Authentication** - Email/password authentication
2. **Firestore Database** - User and agency data storage
3. **Security Rules** - Data access control

## Database Schema

### Users Collection (`users`)
```typescript
{
  uid: string;                    // Firebase Auth UID
  email: string;                  // User email
  displayName: string;            // Full name
  role: 'super_admin' | 'site_admin' | 'user';
  agencyId?: string;              // Required for users
  agencyName?: string;            // For user display
  createdAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}
```

### Agencies Collection (`agencies`)
```typescript
{
  id: string;                     // Auto-generated
  name: string;                   // Agency name
  adminId: string;                // Admin who created it
  createdAt: Date;
  isActive: boolean;
  userCount: number;              // Number of users
}
```

## Setup Instructions

### 1. Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project `echocare-820f4`
3. Enable Authentication with Email/Password provider
4. Enable Firestore Database
5. Configure security rules (see below)

### 2. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && (
        request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin'
      );
    }
    
    // Agencies - admins can read/write, agency users can read their agency
    match /agencies/{agencyId} {
      allow read: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'site_admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.agencyId == agencyId
      );
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'super_admin';
    }
  }
}
```

### 3. Create Initial Admin User
Run the initialization script to create the first admin account:

```bash
# Navigate to project directory
cd care-echo-ui

# Run the admin initialization script
node scripts/init-admin.js
```

**Default Admin Credentials:**
- Email: `admin@careecho.com`
- Password: `admin123456`

⚠️ **Important**: Change the default password immediately after first login!

### 4. Environment Variables
The Firebase configuration is already included in the code, but for production, consider moving it to environment variables:

```env
VITE_FIREBASE_API_KEY=AIzaSyC7zUVUoNBMS-ZP8lFnbz5rUK74O7FPVdA
VITE_FIREBASE_AUTH_DOMAIN=echocare-820f4.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=echocare-820f4
VITE_FIREBASE_STORAGE_BUCKET=echocare-820f4.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=46348462046
VITE_FIREBASE_APP_ID=1:46348462046:web:1241ab6df66319b16f1f4f
VITE_FIREBASE_MEASUREMENT_ID=G-EQSRV42GJB
```

## Usage Guide

### Authentication Flow
1. **Login**: Users authenticate via `/login` page
2. **Role Check**: System verifies user permissions
3. **Route Protection**: Protected routes check authentication and roles
4. **Session Management**: Firebase handles session persistence

### Creating Users
1. **Admin**: Can create any type of user account
2. **Agency**: Can create user accounts within their agency
3. **Users**: Cannot create other accounts

### Agency Management
1. **Admins**: Can create and manage all agencies
2. **Agency Users**: Can view their agency information
3. **User Association**: Users must be assigned to an agency

## API Reference

### Auth Context Methods
```typescript
// Authentication
login(credentials: LoginCredentials): Promise<void>
logout(): Promise<void>

// User Management
createUser(userData: CreateUserData): Promise<void>
updateUser(uid: string, updates: Partial<UserData>): Promise<void>
getUsersByAgency(agencyId: string): Promise<UserData[]>

// Agency Management
createAgency(agencyData: CreateAgencyData): Promise<string>
getAgencies(): Promise<AgencyData[]>

// Permissions
hasPermission(requiredRole: UserRole): boolean
```

### Protected Routes
```typescript
<ProtectedRoute requiredRole="super_admin">
  <AdminDashboard />
</ProtectedRoute>

<ProtectedRoute requiredRole="user">
  <Survey />
</ProtectedRoute>
```

## Security Considerations

### Best Practices
1. **Password Policy**: Enforce strong passwords (8+ characters, mixed case, numbers)
2. **Session Management**: Use Firebase's built-in session handling
3. **Role Validation**: Always verify permissions on both client and server
4. **Data Access**: Implement proper Firestore security rules
5. **Error Handling**: Don't expose sensitive information in error messages

### Production Checklist
- [ ] Change default admin password
- [ ] Configure Firebase security rules
- [ ] Set up proper CORS policies
- [ ] Enable Firebase App Check
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Regular security audits

## Troubleshooting

### Common Issues
1. **Authentication Failed**: Check Firebase Auth configuration
2. **Permission Denied**: Verify user role and Firestore rules
3. **User Not Found**: Ensure user document exists in Firestore
4. **Agency Association**: Verify user has valid agencyId

### Debug Mode
Enable debug logging in development:
```typescript
// In firebase.ts
if (import.meta.env.DEV) {
  console.log('Firebase initialized in debug mode');
}
```

## Support
For technical support or questions about the authentication system:
- Check Firebase Console for service status
- Review Firestore security rules
- Verify user permissions and role assignments
- Contact system administrator for account issues

---

**Built with ❤️ by ZenwareAI for CareEcho**
