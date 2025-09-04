# Manual Admin Document Creation

Since the production rules require authentication, you need to create the admin user document manually in Firebase Console.

## Step-by-Step Instructions:

### 1. Go to Firebase Console
- Visit: https://console.firebase.google.com/
- Select project: `echocare-820f4`

### 2. Navigate to Firestore Database
- Click **Firestore Database** in the left sidebar
- Click **Start collection** (if no collections exist)

### 3. Create Users Collection
- Collection ID: `users`
- Click **Next**

### 4. Create Admin Document
- Document ID: `UwPSQuXCAxaJeLe9Q5c35LtwJGa2` (use this exact UID)
- Add these fields:

| Field | Type | Value |
|-------|------|-------|
| uid | string | UwPSQuXCAxaJeLe9Q5c35LtwJGa2 |
| email | string | admin@careecho.com |
| displayName | string | System Administrator |
| role | string | super_admin |
| createdAt | timestamp | [current timestamp] |
| lastLoginAt | timestamp | [current timestamp] |
| isActive | boolean | true |

### 5. Save the Document
- Click **Save**

## Alternative: Use Test Rules Temporarily

If you want to use the script instead:

1. **Temporarily switch to test rules** in Firebase Console:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

2. **Run the script**:
```bash
node scripts/create-admin-doc.js
```

3. **Switch back to production rules** when done.

## Verify Setup

After creating the document:
1. Go to your app: `http://localhost:8081/login`
2. Login with: `admin@careecho.com` / `admin123456`
3. Check that you can access `/admin` and see user data
4. Try creating new users and agencies

---

**Note**: The production rules require authentication, so manual creation or temporary test rules are needed for initial setup.
