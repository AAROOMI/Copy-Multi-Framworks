
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import firebaseAppletConfig from "./firebase-applet-config.json";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyBY2XUA9lh47JrdPLUJq-D3hkCioDC9SIs",
  authDomain: firebaseAppletConfig.authDomain || "gen-lang-client-0539526472.firebaseapp.com",
  databaseURL: (firebaseAppletConfig as any).databaseURL || "https://gen-lang-client-0539526472-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: firebaseAppletConfig.projectId || "gen-lang-client-0539526472",
  storageBucket: firebaseAppletConfig.storageBucket || "gen-lang-client-0539526472.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "442027961273",
  appId: firebaseAppletConfig.appId || "1:442027961273:web:6a4b42e806933c92b96468",
  measurementId: firebaseAppletConfig.measurementId || "G-J64Q0033C1",
  firestoreDatabaseId: (firebaseAppletConfig as any).firestoreDatabaseId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId) 
  : getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Analytics safely
let analyticsInstance = null;
if (typeof window !== 'undefined') {
  try {
    analyticsInstance = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics is not supported in this environment:", error);
  }
}
export const analytics = analyticsInstance;

export { firebaseConfig };

// Error handling for Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
