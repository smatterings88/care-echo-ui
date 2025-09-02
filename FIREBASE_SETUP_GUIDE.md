# Firebase Console Setup Guide

## Quick Fix for Authentication Issues

### Step 1: Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `echocare-820f4`
3. In the left sidebar, click **Authentication**
4. Click **Get started** or **Sign-in method**
5. Enable **Email/Password** provider
6. Click **Save**

### Step 2: Enable Firestore Database

1. In the left sidebar, click **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (we'll add security rules later)
4. Select a location (choose the closest to your users)
5. Click **Done**

### Step 3: Create Admin User Document

1. In Firestore Database, click **Start collection**
2. Collection ID: `users`
3. Click **Next**
4. Document ID: (use the UID from the script output)
5. Add these fields:

| Field | Type | Value |
|-------|------|-------|
| email | string | admin@careecho.com |
| displayName | string | System Administrator |
| role | string | admin |
| createdAt | timestamp | [current timestamp] |
| lastLoginAt | timestamp | [current timestamp] |
| isActive | boolean | true |

6. Click **Save**

### Step 4: Test Login

1. Go to your app: `http://localhost:8081/login`
2. Use credentials:
   - Email: `admin@careecho.com`
   - Password: `admin123456`
3. You should now be able to log in successfully!

## Alternative: Quick Test Mode

If you want to test immediately without setting up Firestore:

1. **Enable Firestore in test mode** (allows all reads/writes)
2. **Run the full admin script**:
   ```bash
   node scripts/init-admin.js
   ```
3. **Login with the default credentials**

## Security Rules (For Later)

Once everything is working, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /agencies/{agencyId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### "Invalid credentials" error
- Make sure Firebase Authentication is enabled
- Verify the user exists in Firebase Auth
- Check that the Firestore document exists

### "Permission denied" error
- Enable Firestore in test mode
- Or create the user document manually
- Or update security rules

### "User data not found" error
- Create the Firestore document manually
- Or run the admin creation script

---

**Need help?** Check the Firebase Console status and ensure all services are enabled.
