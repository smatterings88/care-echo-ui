// Test Firebase Authentication
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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

const testAuth = async () => {
  try {
    console.log('🔄 Testing Firebase Authentication...');
    
    const userCredential = await signInWithEmailAndPassword(
      auth,
      'admin@careecho.com',
      'admin123456'
    );

    console.log('✅ Authentication successful!');
    console.log('👤 User:', userCredential.user.email);
    console.log('🆔 UID:', userCredential.user.uid);
    console.log('📝 Display Name:', userCredential.user.displayName);
    
    // Sign out
    await auth.signOut();
    console.log('👋 Signed out successfully');
    
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 'auth/user-not-found') {
      console.log('💡 The user does not exist. Run the admin creation script first.');
    } else if (error.code === 'auth/wrong-password') {
      console.log('💡 Wrong password. Check the password in the script.');
    } else if (error.code === 'auth/invalid-email') {
      console.log('💡 Invalid email format.');
    } else {
      console.log('💡 Check Firebase Console > Authentication > Sign-in method');
    }
  }
};

testAuth();
