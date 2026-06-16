import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

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
  // Always maintain local storage backup for maximum resilience and offline/closing protection
  try {
    const localDays = JSON.parse(localStorage.getItem(`days_${userId}`) || "[]");
    const idx = localDays.findIndex((d: any) => d.id === day.id);
    if (idx >= 0) {
      localDays[idx] = day;
    } else {
      localDays.push(day);
    }
    localStorage.setItem(`days_${userId}`, JSON.stringify(localDays));
  } catch (err) {
    console.warn("Offline/local store backup write failed for days:", err);
  }

  // If Firebase is inactive or user is guest/unauthenticated, do not hit cloud
  if (!isFirebaseActive || !db || userId === "local_temp") {
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
  // Always load from local backup first if user is local_temp or Firebase is inactive
  if (!isFirebaseActive || !db || userId === "local_temp") {
    return JSON.parse(localStorage.getItem(`days_${userId}`) || "[]");
  }

  const listPath = `users/${userId}/plan_days`;
  try {
    const qSnapshot = await getDocs(collection(db, "users", userId, "plan_days"));
    const days: PlanDay[] = [];
    qSnapshot.forEach((doc) => {
      days.push(doc.data() as PlanDay);
    });
    const sorted = days.sort((a, b) => a.dayNumber - b.dayNumber);
    
    // Update local backup with the latest coordinates from the server
    if (sorted.length > 0) {
      localStorage.setItem(`days_${userId}`, JSON.stringify(sorted));
    }
    return sorted;
  } catch (err) {
    console.warn("Unable to fetch plan days from server, falling back to local copy:", err);
    try {
      handleFirestoreError(err, OperationType.LIST, listPath);
    } catch {
      // Supress and gracefully fall back to local storage
    }
    return JSON.parse(localStorage.getItem(`days_${userId}`) || "[]");
  }
}

export async function syncStudySession(userId: string, session: StudySession): Promise<void> {
  // Always save locally first
  try {
    const localSessions = JSON.parse(localStorage.getItem(`sessions_${userId}`) || "[]");
    const idx = localSessions.findIndex((s: any) => s.id === session.id);
    if (idx >= 0) {
      localSessions[idx] = session;
    } else {
      localSessions.push(session);
    }
    localStorage.setItem(`sessions_${userId}`, JSON.stringify(localSessions));
  } catch (err) {
    console.warn("Offline/local store backup write failed for sessions:", err);
  }

  if (!isFirebaseActive || !db || userId === "local_temp") {
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
  if (!isFirebaseActive || !db || userId === "local_temp") {
    return JSON.parse(localStorage.getItem(`sessions_${userId}`) || "[]");
  }

  const listPath = `users/${userId}/study_sessions`;
  try {
    const qSnapshot = await getDocs(collection(db, "users", userId, "study_sessions"));
    const sessions: StudySession[] = [];
    qSnapshot.forEach((doc) => {
      sessions.push(doc.data() as StudySession);
    });
    
    // Sync into local cache backup
    localStorage.setItem(`sessions_${userId}`, JSON.stringify(sessions));
    return sessions;
  } catch (err) {
    console.warn("Unable to fetch sessions from server, falling back to local copy:", err);
    try {
      handleFirestoreError(err, OperationType.LIST, listPath);
    } catch {
      // Suppress and fallback
    }
    return JSON.parse(localStorage.getItem(`sessions_${userId}`) || "[]");
  }
}

export async function deleteStudySession(userId: string, sessionId: string): Promise<void> {
  // Always clear locally first
  try {
    const localSessions = JSON.parse(localStorage.getItem(`sessions_${userId}`) || "[]") as StudySession[];
    const updated = localSessions.filter(s => s.id !== sessionId);
    localStorage.setItem(`sessions_${userId}`, JSON.stringify(updated));
  } catch (err) {
    console.warn("Offline/local store backup delete failed:", err);
  }

  if (!isFirebaseActive || !db || userId === "local_temp") {
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
  // Always save locally first
  try {
    localStorage.setItem(`settings_${userId}`, JSON.stringify(settings));
  } catch (err) {
    console.warn("Offline/local store backup write failed for settings:", err);
  }

  if (!isFirebaseActive || !db || userId === "local_temp") {
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
  if (!isFirebaseActive || !db || userId === "local_temp") {
    const data = localStorage.getItem(`settings_${userId}`);
    return data ? JSON.parse(data) : null;
  }

  const sConfig = `users/${userId}/settings/config`;
  try {
    const docSnap = await getDoc(doc(db, "users", userId, "settings", "config"));
    if (docSnap.exists()) {
      const parsed = docSnap.data() as UserSettings;
      localStorage.setItem(`settings_${userId}`, JSON.stringify(parsed));
      return parsed;
    }
    
    // If no record on server but we have local backup, return local backup
    const localData = localStorage.getItem(`settings_${userId}`);
    return localData ? JSON.parse(localData) : null;
  } catch (err) {
    console.warn("Unable to fetch settings from server, falling back to local copy:", err);
    try {
      handleFirestoreError(err, OperationType.GET, sConfig);
    } catch {
      // Suppress and fallback
    }
    const data = localStorage.getItem(`settings_${userId}`);
    return data ? JSON.parse(data) : null;
  }
}

// REAL-TIME SYNCHRONIZATION HELPERS
export function subscribePlanDays(userId: string, onUpdate: (days: PlanDay[]) => void): () => void {
  if (!isFirebaseActive || !db || userId === "local_temp") {
    return () => {};
  }
  return onSnapshot(
    collection(db, "users", userId, "plan_days"),
    (snapshot) => {
      const days: PlanDay[] = [];
      snapshot.forEach((doc) => {
        days.push(doc.data() as PlanDay);
      });
      const sorted = days.sort((a, b) => a.dayNumber - b.dayNumber);
      if (sorted.length > 0) {
        localStorage.setItem(`days_${userId}`, JSON.stringify(sorted));
        onUpdate(sorted);
      }
    },
    (error) => {
      console.warn("Real-time plan days subscription error:", error);
    }
  );
}

export function subscribeStudySessions(userId: string, onUpdate: (sessions: StudySession[]) => void): () => void {
  if (!isFirebaseActive || !db || userId === "local_temp") {
    return () => {};
  }
  return onSnapshot(
    collection(db, "users", userId, "study_sessions"),
    (snapshot) => {
      const sessions: StudySession[] = [];
      snapshot.forEach((doc) => {
        sessions.push(doc.data() as StudySession);
      });
      localStorage.setItem(`sessions_${userId}`, JSON.stringify(sessions));
      onUpdate(sessions);
    },
    (error) => {
      console.warn("Real-time study sessions subscription error:", error);
    }
  );
}

export function subscribeUserSettings(userId: string, onUpdate: (settings: UserSettings) => void): () => void {
  if (!isFirebaseActive || !db || userId === "local_temp") {
    return () => {};
  }
  return onSnapshot(
    doc(db, "users", userId, "settings", "config"),
    (docSnap) => {
      if (docSnap.exists()) {
        const parsed = docSnap.data() as UserSettings;
        localStorage.setItem(`settings_${userId}`, JSON.stringify(parsed));
        onUpdate(parsed);
      }
    },
    (error) => {
      console.warn("Real-time user settings subscription error:", error);
    }
  );
}
