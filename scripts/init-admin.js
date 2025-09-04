// Script to initialize the first admin user
// Run this script once to create the initial admin account

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
const db = getFirestore(app);

const createInitialAdmin = async () => {
  try {
    // Create the admin user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@careecho.com',
      'admin123456' // Change this to a secure password
    );

    // Update the display name
    await updateProfile(userCredential.user, {
      displayName: 'System Administrator'
    });

    // Create the user document in Firestore
    const userDoc = {
      uid: userCredential.user.uid,
      email: 'admin@careecho.com',
      displayName: 'System Administrator',
      role: 'super_admin',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

    console.log('✅ Initial admin user created successfully!');
    console.log('Email: admin@careecho.com');
    console.log('Password: admin123456');
    console.log('UID:', userCredential.user.uid);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
};

// Run the script
createInitialAdmin();
