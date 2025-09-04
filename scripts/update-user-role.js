import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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

async function updateUserRole(userId, newRole) {
  try {
    console.log(`🔄 Updating user ${userId} role to ${newRole}...`);
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('👤 Current user data:', userData);
      
      await updateDoc(userRef, {
        role: newRole
      });
      
      console.log('✅ Role updated successfully!');
    } else {
      console.log('❌ User document not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Update the specific user - replace with your actual user ID
// You can find your user ID in the browser console or Firebase console
const userId = 'your_user_id_here'; // Replace with your actual user ID
updateUserRole(userId, 'super_admin');
