import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, isFirebaseConfigured, auth, mockAuth } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface UserProfile {
  displayName: string;
  email: string;
  createdAt: string;
  targets: {
    steps: number;
    water: number; // in ml
    calories: number; // target daily burn or consumption target
    weight: number; // target weight in kg
  };
}

export interface DailyLog {
  steps: number;
  water: number; // in ml
  caloriesBurned: number;
  caloriesConsumed: number;
  workoutsCompleted: string[];
  weight?: number;
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: "Burner Champ",
  email: "champ@feelburn.com",
  createdAt: new Date().toISOString(),
  targets: {
    steps: 10000,
    water: 3000,
    calories: 2500,
    weight: 75.0,
  }
};

const DEFAULT_DAILY_LOG: DailyLog = {
  steps: 0,
  water: 0,
  caloriesBurned: 0,
  caloriesConsumed: 0,
  workoutsCompleted: [],
};

let isFirestoreHealthy = true;

function handleFirestoreError(error: any, operationName: string) {
  console.warn(`[FeelBurn] Firestore operation "${operationName}" failed. Falling back to local storage.`, error);
  // If database is unprovisioned, offline, or permissions are wrong, switch to local mode
  if (error && (
    error.toString().includes("offline") || 
    error.toString().includes("not found") || 
    error.toString().includes("permission-denied") ||
    error.code === "unavailable" ||
    error.code === "permission-denied"
  )) {
    if (isFirestoreHealthy) {
      isFirestoreHealthy = false;
      console.warn("[FeelBurn] Firestore has been temporarily marked as UNHEALTHY. Bypassing Firestore for the rest of this session.");
    }
  }
}

export const FitnessService = {
  /**
   * Get active User ID from either real Firebase or Mock Auth
   */
  getUid(): string | null {
    if (isFirebaseConfigured && auth) {
      return auth.currentUser?.uid || null;
    }
    return mockAuth.getCurrentUser()?.uid || "mock_user_12345";
  },

  /**
   * Fetch User Profile Goals
   */
  async getProfile(): Promise<UserProfile> {
    const uid = this.getUid();
    if (!uid) return DEFAULT_PROFILE;

    if (isFirebaseConfigured && db && isFirestoreHealthy) {
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as UserProfile;
        } else {
          // Initialize in Firestore
          await setDoc(docRef, DEFAULT_PROFILE);
          return DEFAULT_PROFILE;
        }
      } catch (error) {
        handleFirestoreError(error, "getProfile");
      }
    }

    // Sandbox / Offline Cache Mode
    try {
      const localProfile = await AsyncStorage.getItem(`@feelburn_profile_${uid}`);
      if (localProfile) {
        return JSON.parse(localProfile) as UserProfile;
      } else {
        await AsyncStorage.setItem(`@feelburn_profile_${uid}`, JSON.stringify(DEFAULT_PROFILE));
        return DEFAULT_PROFILE;
      }
    } catch (e) {
      return DEFAULT_PROFILE;
    }
  },

  /**
   * Save / Update User Profile Goals
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    const uid = this.getUid();
    if (!uid) return;

    if (isFirebaseConfigured && db && isFirestoreHealthy) {
      try {
        const docRef = doc(db, "users", uid);
        await setDoc(docRef, profile, { merge: true });
        console.log("Profile saved to Firestore!");
      } catch (error) {
        handleFirestoreError(error, "saveProfile");
      }
    }

    // Local Storage always saved as a reliable offline copy
    try {
      await AsyncStorage.setItem(`@feelburn_profile_${uid}`, JSON.stringify(profile));
    } catch (e) {
      console.error("Error saving profile locally", e);
    }
  },

  /**
   * Fetch Daily Log for a specific date (YYYY-MM-DD)
   */
  async getDailyLog(date: string): Promise<DailyLog> {
    const uid = this.getUid();
    if (!uid) return DEFAULT_DAILY_LOG;

    if (isFirebaseConfigured && db && isFirestoreHealthy) {
      try {
        const docRef = doc(db, "users", uid, "daily_logs", date);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data() as DailyLog;
        }
      } catch (error) {
        handleFirestoreError(error, "getDailyLog");
      }
    }

    // Local Storage Sandbox Fallback
    try {
      const localLog = await AsyncStorage.getItem(`@feelburn_log_${uid}_${date}`);
      if (localLog) {
        return JSON.parse(localLog) as DailyLog;
      }
    } catch (e) {
      console.error("Error fetching local daily log", e);
    }

    return { ...DEFAULT_DAILY_LOG };
  },

  /**
   * Update Daily Log (merges partial updates)
   */
  async updateDailyLog(date: string, updates: Partial<DailyLog>): Promise<DailyLog> {
    const uid = this.getUid();
    if (!uid) return { ...DEFAULT_DAILY_LOG, ...updates };

    const currentLog = await this.getDailyLog(date);
    const updatedLog: DailyLog = {
      ...currentLog,
      ...updates,
      // Handle merges for nested list if necessary
      workoutsCompleted: updates.workoutsCompleted !== undefined 
        ? updates.workoutsCompleted 
        : currentLog.workoutsCompleted
    };

    if (isFirebaseConfigured && db && isFirestoreHealthy) {
      try {
        const docRef = doc(db, "users", uid, "daily_logs", date);
        await setDoc(docRef, updatedLog, { merge: true });
        console.log("Firestore Log updated!");
      } catch (error) {
        handleFirestoreError(error, "updateDailyLog");
      }
    }

    // Save locally
    try {
      await AsyncStorage.setItem(`@feelburn_log_${uid}_${date}`, JSON.stringify(updatedLog));
    } catch (e) {
      console.error("Error saving daily log locally", e);
    }

    return updatedLog;
  },

  /**
   * Load history of daily logs for the last N days (for custom charting)
   */
  async getRecentHistory(daysCount: number = 7): Promise<{ date: string; log: DailyLog }[]> {
    const today = new Date();
    const promises: Promise<{ date: string; log: DailyLog }>[] = [];

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      promises.push(
        this.getDailyLog(dateStr).then(log => ({ date: dateStr, log }))
      );
    }

    return Promise.all(promises);
  }
};
