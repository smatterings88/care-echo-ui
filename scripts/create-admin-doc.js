// Create admin user document in Firestore
import { initializeApp } from 'firebase/app';
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
const db = getFirestore(app);

const createAdminDocument = async () => {
  try {
    console.log('🔄 Creating admin user document in Firestore...');
    
    // Use the UID from the test script
    const adminUid = 'UwPSQuXCAxaJeLe9Q5c35LtwJGa2';
    
    const userDoc = {
      uid: adminUid,
      email: 'admin@careecho.com',
      displayName: 'System Administrator',
      role: 'admin',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isActive: true,
    };

    await setDoc(doc(db, 'users', adminUid), userDoc);

    console.log('✅ Admin user document created successfully!');
    console.log('📧 Email: admin@careecho.com');
    console.log('🆔 UID:', adminUid);
    console.log('👤 Role: admin');
    console.log('');
    console.log('🎉 You can now use all admin features!');
    
  } catch (error) {
    console.error('❌ Error creating admin document:', error.message);
    console.log('');
    console.log('💡 Make sure:');
    console.log('   - Firestore Database is enabled');
    console.log('   - Security rules are published');
    console.log('   - You have proper permissions');
  }
};

createAdminDocument();
