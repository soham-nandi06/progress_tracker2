import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAP5ZbwnQDPb990F4pH9mK7weQ8y5GuGQs",
  authDomain: "progress-tracker-7e9cb.firebaseapp.com",
  projectId: "progress-tracker-7e9cb",
  storageBucket: "progress-tracker-7e9cb.firebasestorage.app",
  messagingSenderId: "750769634352",
  appId: "1:750769634352:web:840e047b17c44be98cc1f5",
  measurementId: "G-HXERCNCFRR"
};

let db: any = null;
let auth: any = null;
let googleProvider: GoogleAuthProvider | null = null;
let isFirebaseActive = false;

// Check if we are running with placeholder dummy key
const isDummy = firebaseConfig.apiKey.includes("DUMMY") || firebaseConfig.projectId === "dummy-project";

if (!isDummy) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    isFirebaseActive = true;
    console.log("Firebase initialized successfully with live cloud credentials.");

    // Validate connection to Firestore as requested by the firebase-integration skill
    const testConnection = async () => {
      try {
        const testRef = doc(db, 'test', 'connection');
        await getDoc(testRef);
      } catch (error: any) {
        if (error?.message && error.message.includes('offline')) {
          console.warn("Firebase client is currently offline; syncing changes locally.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Firebase failed to initialize:", error);
  }
} else {
  console.log("Using Local Storage Sync (Firebase config pending approval/deployment).");
}

export { db, auth, googleProvider, isFirebaseActive };

// Types matching firestore schemas
import { PlanDay, StudySession, UserSettings } from "./types";

// Firebase error handler conformant to the firebase-integration skill instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUserId = auth?.currentUser?.uid || null;
  const currentUserEmail = auth?.currentUser?.email || null;
  const currentEmailVerified = auth?.currentUser?.emailVerified || null;

  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUserId,
      email: currentUserEmail,
      emailVerified: currentEmailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous || false,
    },
    operationType,
    path
  };
  console.error('Firestore Hardened Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// SECURE CLOUD-SYNC API ENGINES
export async function syncPlanDay(userId: string, day: PlanDay): Promise<void> {
  if (!isFirebaseActive || !db) {
    // Save to local storage
    const localDays = JSON.parse(localStorage.getItem(`days_${userId}`) || "[]");
    const idx = localDays.findIndex((d: any) => d.id === day.id);
    if (idx >= 0) {
      localDays[idx] = day;
    } else {
      localDays.push(day);
    }
    localStorage.setItem(`days_${userId}`, JSON.stringify(localDays));
    return;
  }

  const dPath = `users/${userId}/plan_days/${day.id}`;
  try {
    await setDoc(doc(db, "users", userId, "plan_days", day.id), day);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, dPath);
  }
}

export async function getPlanDays(userId: string): Promise<PlanDay[]> {
  if (!isFirebaseActive || !db) {
    return JSON.parse(localStorage.getItem(`days_${userId}`) || "[]");
  }

  const listPath = `users/${userId}/plan_days`;
  try {
    const qSnapshot = await getDocs(collection(db, "users", userId, "plan_days"));
    const days: PlanDay[] = [];
    qSnapshot.forEach((doc) => {
      days.push(doc.data() as PlanDay);
    });
    // Sort buy day number
    return days.sort((a, b) => a.dayNumber - b.dayNumber);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, listPath);
    return [];
  }
}

export async function syncStudySession(userId: string, session: StudySession): Promise<void> {
  if (!isFirebaseActive || !db) {
    const localSessions = JSON.parse(localStorage.getItem(`sessions_${userId}`) || "[]");
    localSessions.push(session);
    localStorage.setItem(`sessions_${userId}`, JSON.stringify(localSessions));
    return;
  }

  const sPath = `users/${userId}/study_sessions/${session.id}`;
  try {
    await setDoc(doc(db, "users", userId, "study_sessions", session.id), session);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, sPath);
  }
}

export async function getStudySessions(userId: string): Promise<StudySession[]> {
  if (!isFirebaseActive || !db) {
    return JSON.parse(localStorage.getItem(`sessions_${userId}`) || "[]");
  }

  const listPath = `users/${userId}/study_sessions`;
  try {
    const qSnapshot = await getDocs(collection(db, "users", userId, "study_sessions"));
    const sessions: StudySession[] = [];
    qSnapshot.forEach((doc) => {
      sessions.push(doc.data() as StudySession);
    });
    return sessions;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, listPath);
    return [];
  }
}

export async function deleteStudySession(userId: string, sessionId: string): Promise<void> {
  if (!isFirebaseActive || !db) {
    const localSessions = JSON.parse(localStorage.getItem(`sessions_${userId}`) || "[]") as StudySession[];
    const updated = localSessions.filter(s => s.id !== sessionId);
    localStorage.setItem(`sessions_${userId}`, JSON.stringify(updated));
    return;
  }

  const sPath = `users/${userId}/study_sessions/${sessionId}`;
  try {
    await deleteDoc(doc(db, "users", userId, "study_sessions", sessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, sPath);
  }
}

export async function syncUserSettings(userId: string, settings: UserSettings): Promise<void> {
  if (!isFirebaseActive || !db) {
    localStorage.setItem(`settings_${userId}`, JSON.stringify(settings));
    return;
  }

  const sConfig = `users/${userId}/settings/config`;
  try {
    await setDoc(doc(db, "users", userId, "settings", "config"), settings);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, sConfig);
  }
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (!isFirebaseActive || !db) {
    const data = localStorage.getItem(`settings_${userId}`);
    return data ? JSON.parse(data) : null;
  }

  const sConfig = `users/${userId}/settings/config`;
  try {
    const docSnap = await getDoc(doc(db, "users", userId, "settings", "config"));
    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, sConfig);
    return null;
  }
}
