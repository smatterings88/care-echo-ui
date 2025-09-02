import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC7zUVUoNBMS-ZP8lFnbz5rUK74O7FPVdA",
  authDomain: "echocare-820f4.firebaseapp.com",
  projectId: "echocare-820f4",
  storageBucket: "echocare-820f4.firebasestorage.app",
  messagingSenderId: "46348462046",
  appId: "1:46348462046:web:1241ab6df66319b16f1f4f",
  measurementId: "G-EQSRV42GJB"
};

// Initialize (or reuse) default app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Create an isolated secondary app for privileged actions (e.g., create users)
// Using a separate auth instance prevents switching the current session
let secondaryAppInstance: ReturnType<typeof initializeApp> | null = null;
export const getSecondaryApp = () => {
  if (!secondaryAppInstance) {
    secondaryAppInstance = initializeApp(firebaseConfig, 'secondary');
  }
  return secondaryAppInstance;
};

export default app;
