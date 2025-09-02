// Simple admin creation script - creates Firebase Auth user only
// Run this first, then manually add the Firestore document

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC7zUVUoNBMS-ZP8lFnbz5rUK74O7FPVdA",
  authDomain: "echocare-820f4.firebaseapp.com",
  projectId: "echocare-820f4",
  storageBucket: "echocare-820f4.firebasestorage.app",
  messagingSenderId: "46348462046",
  appId: "1:46348462046:web:1241ab6df66319b16f1f4f",
  measurementId: "G-EQSRV42GJB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const createSimpleAdmin = async () => {
  try {
    console.log('🔄 Creating admin user in Firebase Auth...');
    
    // Create the admin user in Firebase Auth only
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@careecho.com',
      'admin123456'
    );

    // Update the display name
    await updateProfile(userCredential.user, {
      displayName: 'System Administrator'
    });

    console.log('✅ Firebase Auth user created successfully!');
    console.log('📧 Email: admin@careecho.com');
    console.log('🔑 Password: admin123456');
    console.log('🆔 UID:', userCredential.user.uid);
    console.log('');
    console.log('⚠️  IMPORTANT: You need to manually create the Firestore document.');
    console.log('📋 Go to Firebase Console > Firestore Database > Start collection > users');
    console.log('📄 Create a document with ID:', userCredential.user.uid);
    console.log('📝 Add these fields:');
    console.log('   - email: "admin@careecho.com"');
    console.log('   - displayName: "System Administrator"');
    console.log('   - role: "admin"');
    console.log('   - createdAt: [current timestamp]');
    console.log('   - lastLoginAt: [current timestamp]');
    console.log('   - isActive: true');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️  Admin user already exists in Firebase Auth');
      console.log('📧 Email: admin@careecho.com');
      console.log('🔑 Password: admin123456');
      console.log('');
      console.log('⚠️  You still need to create the Firestore document manually.');
    } else {
      console.error('❌ Error creating admin user:', error.message);
    }
  }
};

// Run the script
createSimpleAdmin();
