import { initializeApp, getApps } from 'firebase/app';
// @ts-ignore - getReactNativePersistence is a mobile-specific export from firebase/auth resolved at runtime
import { initializeAuth, getReactNativePersistence, Auth, User } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// -------------------------------------------------------------
// firebaseConfig.ts - Firebase and Offline Sandbox Controller
// -------------------------------------------------------------

// FIREBASE CONFIGURATION
// Loads from environment variables (.env file) with fallback placeholders.
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "PLACEHOLDER_API_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "feelburn-app.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "feelburn-app",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "feelburn-app.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456789"
};

// Check if keys are active (not placeholder)
export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY" &&
  firebaseConfig.apiKey.trim() !== "";

let app: any = null;
let realAuth: Auth | null = null;
let realDb: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      realAuth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      realDb = getFirestore(app);
      console.log("[FeelBurn] Real Firebase initialized successfully!");
    } else {
      app = getApps()[0];
      realAuth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      realDb = getFirestore(app);
    }
  } catch (error) {
    console.error("[FeelBurn] Error initializing Firebase, falling back to Sandbox:", error);
  }
} else {
  console.log("[FeelBurn] Running in SANDBOX MODE (Offline Mock Database via AsyncStorage). No credentials detected.");
}

// -------------------------------------------------------------
// LOCAL STORAGE MOCK DATABASE (AsyncStorage Fallback)
// -------------------------------------------------------------
class MockAuthService {
  private currentMockUser: User | null = null;
  private authListeners: ((user: any | null) => void)[] = [];

  constructor() {
    this.loadPersistedUser();
  }

  private async loadPersistedUser() {
    try {
      const savedUser = await AsyncStorage.getItem('@feelburn_mock_user');
      if (savedUser) {
        this.currentMockUser = JSON.parse(savedUser);
        this.triggerListeners();
      }
    } catch (e) {
      console.error("Error loading persisted mock user", e);
    }
  }

  private triggerListeners() {
    this.authListeners.forEach(listener => listener(this.currentMockUser));
  }

  async signUp(email: string, pass: string, name: string) {
    const newUser = {
      uid: "mock_user_" + Math.random().toString(36).substr(2, 9),
      email: email,
      displayName: name || email.split('@')[0],
      emailVerified: true,
      metadata: {},
    } as unknown as User;

    this.currentMockUser = newUser;
    await AsyncStorage.setItem('@feelburn_mock_user', JSON.stringify(newUser));
    
    // Initialize mock profile
    const defaultProfile = {
      displayName: name,
      email: email,
      createdAt: new Date().toISOString(),
      targets: {
        steps: 10000,
        water: 3000,
        calories: 2500,
        weight: 75.0
      }
    };
    await AsyncStorage.setItem(`@feelburn_profile_${newUser.uid}`, JSON.stringify(defaultProfile));
    
    this.triggerListeners();
    return newUser;
  }

  async login(email: string, pass: string) {
    // Standard mock login accepts any email/pass for testing convenience
    const user = {
      uid: "mock_user_12345",
      email: email,
      displayName: email.split('@')[0],
      emailVerified: true,
    } as unknown as User;

    this.currentMockUser = user;
    await AsyncStorage.setItem('@feelburn_mock_user', JSON.stringify(user));
    
    // Check if profile exists, if not create default
    const profileKey = `@feelburn_profile_${user.uid}`;
    const profile = await AsyncStorage.getItem(profileKey);
    if (!profile) {
      const defaultProfile = {
        displayName: user.displayName,
        email: email,
        createdAt: new Date().toISOString(),
        targets: {
          steps: 10000,
          water: 3000,
          calories: 2500,
          weight: 75.0
        }
      };
      await AsyncStorage.setItem(profileKey, JSON.stringify(defaultProfile));
    }

    this.triggerListeners();
    return user;
  }

  async logout() {
    this.currentMockUser = null;
    await AsyncStorage.removeItem('@feelburn_mock_user');
    this.triggerListeners();
  }

  onAuthStateChanged(callback: (user: any | null) => void) {
    this.authListeners.push(callback);
    // Immediately call back with current value
    callback(this.currentMockUser);
    return () => {
      this.authListeners = this.authListeners.filter(l => l !== callback);
    };
  }

  getCurrentUser() {
    return this.currentMockUser;
  }
}

export const mockAuth = new MockAuthService();
export { realAuth as auth, realDb as db };
