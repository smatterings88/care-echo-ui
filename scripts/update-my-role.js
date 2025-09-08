import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
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
const db = getFirestore(app);
const auth = getAuth(app);

async function updateMyRole() {
  try {
    // Replace with your actual password
    const email = 'mgzobel@icloud.com';
    const password = 'YOUR_PASSWORD_HERE'; // Replace this with your actual password
    
    console.log('🔐 Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('📋 Checking current role...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('👤 Current user data:', {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role
      });
      
      if (userData.role === 'admin') {
        console.log('🔄 Updating role from "admin" to "super_admin"...');
        await updateDoc(doc(db, 'users', user.uid), {
          role: 'super_admin'
        });
        console.log('✅ Role updated successfully! You can now refresh your browser.');
      } else {
        console.log('✅ Role is already correct:', userData.role);
      }
    } else {
      console.log('❌ User document not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('💡 Make sure to replace YOUR_PASSWORD_HERE with your actual password');
  }
}

updateMyRole();
