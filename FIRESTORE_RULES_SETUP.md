# Firestore Rules Setup Guide

## Current Issue
You're getting "Missing or insufficient permissions" because Firestore security rules are blocking access. Here's how to fix it:

## Option 1: Quick Test Mode (Recommended for Development)

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `echocare-820f4`
3. **Navigate to Firestore Database**
4. **Click on "Rules" tab**
5. **Replace the existing rules with**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Test mode - allow all authenticated users to read and write
    // WARNING: This is for development/testing only!
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

6. **Click "Publish"**

## Option 2: Production Rules (More Secure)

Use the rules from `firestore.rules` file:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can read their own data, admins can read/write all
    match /users/{userId} {
      allow read: if request.auth != null && (
        request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null && (
        request.auth.uid == userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Agencies collection - admins can read/write, agency users can read their agency
    match /agencies/{agencyId} {
      allow read: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'agency' ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.agencyId == agencyId
      );
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Surveys collection - users can read/write their own surveys
    match /surveys/{surveyId} {
      allow read, write: if request.auth != null && (
        request.auth.uid == resource.data.userId || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Default - deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Step-by-Step Instructions

### 1. Enable Firestore Database
1. Go to Firebase Console
2. Select project `echocare-820f4`
3. Click **Firestore Database** in the left sidebar
4. Click **Create database**
5. Choose **Start in test mode** (allows all reads/writes)
6. Select a location (choose closest to your users)
7. Click **Done**

### 2. Set Security Rules
1. In Firestore Database, click the **Rules** tab
2. Replace the default rules with one of the options above
3. Click **Publish**

### 3. Test the Rules
1. Go back to your app: `http://localhost:8081/login`
2. Login with: `admin@careecho.com` / `admin123456`
3. Try accessing admin features

## Rule Explanations

### Test Mode Rules
- **Allows**: Any authenticated user to read/write any document
- **Use for**: Development and testing
- **Security**: Low (not recommended for production)

### Production Rules
- **Users**: Can only read/write their own data
- **Admins**: Can read/write all user and agency data
- **Agencies**: Users can only see their own agency
- **Surveys**: Users can only access their own surveys
- **Security**: High (recommended for production)

## Troubleshooting

### "Missing or insufficient permissions"
- Make sure Firestore Database is enabled
- Check that security rules are published
- Verify you're using test mode rules for development

### "Rules deployment failed"
- Check the syntax of your rules
- Make sure you're in the correct project
- Try the test mode rules first

### "User data not found"
- Create the user document manually in Firestore
- Or run the admin creation script again

## Next Steps

1. **Start with test mode rules** to get everything working
2. **Test all features** to make sure they work
3. **Switch to production rules** when ready for deployment
4. **Monitor usage** in Firebase Console

---

**Need help?** Check the Firebase Console for any error messages or service status.
