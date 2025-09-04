import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/query';
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

async function checkAndUpdateUserRole() {
  try {
    // Replace with your email and password
    const email = 'mgzobel@icloud.com';
    const password = 'your_password_here';
    
    console.log('🔐 Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('📋 Checking user role...');
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('👤 Current user data:', userData);
      
      // Check if role needs updating
      if (userData.role === 'admin') {
        console.log('🔄 Updating role from "admin" to "super_admin"...');
        await updateDoc(doc(db, 'users', user.uid), {
          role: 'super_admin'
        });
        console.log('✅ Role updated successfully!');
      } else if (userData.role === 'manager') {
        console.log('🔄 Updating role from "manager" to "org_admin"...');
        await updateDoc(doc(db, 'users', user.uid), {
          role: 'org_admin'
        });
        console.log('✅ Role updated successfully!');
      } else if (userData.role === 'agency') {
        console.log('🔄 Updating role from "agency" to "site_admin"...');
        await updateDoc(doc(db, 'users', user.uid), {
          role: 'site_admin'
        });
        console.log('✅ Role updated successfully!');
      } else {
        console.log('✅ Role is already updated:', userData.role);
      }
    } else {
      console.log('❌ User document not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndUpdateUserRole();
