# 🔥 FeelBurn — Premium Glassmorphic Fitness App

FeelBurn is an elite, high-energy fitness tracking mobile application built using **React Native**, **Expo (SDK 54)**, **TypeScript**, and **Firebase / Firestore**. Designed with a stunning dark glassmorphism aesthetic, vibrant neon accents, custom SVG concentric progress rings, and a high-performance progress line chart, it offers a visual experience that is responsive, responsive, and visual.

The application is engineered with a **Dual-Mode Sync Architecture**: it runs immediately out-of-the-box in **Expo Go** using an offline **AsyncStorage Sandbox Database**, allowing immediate testing. Once real Firebase configuration keys are added, it seamlessly promotes itself to live cloud-synchronization.

---

## 📱 Features & Visual Identity

### 🎨 Visual Language (Obsidian Dark Theme)
- **Primary Background**: Deep, dark obsidian shades (`#09090E` to `#12121A`) designed to eliminate distractions and command focus.
- **Accents**:
  - **Fire Gradient**: `#FF5E3A` to `#FF2E93` (Active Energy, Calories Burned, Intense HIIT)
  - **Hydra Gradient**: `#00F2FE` to `#4FACFE` (Hydration progress, fresh fluid balance)
  - **Milestone Green**: `#39FF14` (Achieved targets, completed workflows)
- **Glassmorphism Container (`GlassCard`)**: High-end translucent cards with neon border glow effects, dynamic opacity, and high drop shadows for modern card layering.

### 🌟 App Capabilities
1. **Concentric Multi-Goal Rings**: Custom React Native SVG-drawn interactive rings showing progress for **Steps**, **Water Intake**, and **Active Calories Burned** in a single beautiful dashboard circle.
2. **Quick Track Checklist**: Tap action cards directly on the dashboard to log `+250ml Water` or add step counts dynamically with micro-animations.
3. **Gym-Focused Routines**: Loaded catalogue of power exercises separated by compound lifts, hypertrophy sets, and cable isolation movements (e.g., *HIIT Fire Blast*, *Hypertrophy Chest & Arms*, *Leg Destroyer*, *Yoga Recovery*).
4. **Live Stopwatch Timer**: Fullscreen modal tracking active workouts, split cycles, and calorie multipliers with visual neon pulses.
5. **Interactive Weight Spline Chart**: 100% custom SVG path drawing that plots a 7-day weight history spline. This avoids external Canvas/Native engine bindings, ensuring a smooth, crash-free performance inside Expo Go.
6. **Detailed Goals Profile**: Configure targeted counts for steps, calories, water volume, and body weight, and view Firebase integration diagnostics.

---

## ⚡ Architectural Masterpiece: Dual-Mode Sync Layer

To ensure developer setup is painless, the application is equipped with a dual database orchestration driver:
- **Sandbox Mode (Immediate Out-of-the-Box)**: If placeholder credentials are left in `src/config/firebase.ts`, the app routes all authentication, calorie intake logs, hydration checklists, and weight diaries to an offline **AsyncStorage Sandbox Mock DB**. This works immediately with any credentials on physical devices via Expo Go.
- **Cloud Sync Mode**: The moment you replace the placeholder strings in `src/config/firebase.ts` with valid credentials, the app transparently shifts gears to use **Firebase Authentication** and **Google Cloud Firestore** for online real-time data persistence, supporting offline caching.

---

## 🚀 Step 1: Running Locally in Expo Go

Follow these quick commands to spin up the local development server:

### 1. Prerequisites
- **Node.js**: Ensure Node.js (v18 or v20+) is installed.
- **Mobile Device**: Install the official **Expo Go** application on your mobile device (available in iOS App Store and Google Play Store).

### 2. Installation
Clone the repository and install the dependencies:
```bash
# Navigate to project folder
cd FeelBurn_App

# Install node dependencies
npm install
```

### 3. Launch Development Server
```bash
# Start Metro Bundler
npx expo start
```

### 4. Open in Expo Go
- **Android**: Scan the QR code appearing in the terminal using the camera or the QR scanner inside the Expo Go app.
- **iOS**: Scan the QR code using your system camera app and click the link to launch Expo Go.
- *Note*: Ensure your mobile device and computer are on the same local Wi-Fi network. If there are routing issues, press `a` (Android) or `i` (iOS) to launch in virtual emulators, or use the `npx expo start --tunnel` command.

---

## 🔥 Step 2: Setting Up Firebase & Firestore

To activate real-time server database synchronization, follow these steps to connect your Firebase Console:

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it **FeelBurn**.
3. Choose whether to enable Google Analytics (recommended but optional) and click **Create Project**.

### 2. Configure Authentication
1. In the Firebase Sidebar, navigate to **Build > Authentication**.
2. Click **Get Started**, choose the **Sign-in method** tab.
3. Select **Email/Password**, enable it, and save.

### 3. Create Cloud Firestore Database
1. Go to **Build > Firestore Database** in the sidebar.
2. Click **Create Database**.
3. Choose your database location, select **Start in production mode** or **Start in test mode**, and create.
4. Go to the **Rules** tab and configure secure rules. Here are standard rules allowing authenticated users to manage their own records:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
         
         match /daily_logs/{logId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
         match /custom_workouts/{workoutId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
         }
       }
     }
   }
   ```

### 4. Create Web App Credentials
1. On the Firebase Project Overview page, click the **Web icon `</>`** to register a new Web App.
2. Name your web app (e.g. `FeelBurn Mobile App`) and click **Register app**.
3. Copy the `firebaseConfig` keys from the setup screen. It will look like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyA1...",
     authDomain: "feelburn-app.firebaseapp.com",
     projectId: "feelburn-app",
     storageBucket: "feelburn-app.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef..."
   };
   ```

### 5. Update the App Code
Open `src/config/firebase.ts` in your text editor and modify the placeholder config at **Line 14**:
```typescript
// Replace this block with your actual keys
export const firebaseConfig = {
  apiKey: "YOUR_COPIED_API_KEY",
  authDomain: "YOUR_COPIED_AUTH_DOMAIN",
  projectId: "YOUR_COPIED_PROJECT_ID",
  storageBucket: "YOUR_COPIED_STORAGE_BUCKET",
  messagingSenderId: "YOUR_COPIED_SENDER_ID",
  appId: "YOUR_COPIED_APP_ID"
};
```
Save the file. If Metro is running, it will automatically hot-reload. The app will detect the configuration keys, and the HUD in the Profile tab will transition to **"ONLINE (Firebase Auth & Firestore Connected)"**!

---

## 🐙 Step 3: Git Initialization & GitHub Upload

Save your development logs and upload them to a remote git provider (GitHub) for version control and safe keeping:

### 1. Local Commit
Initialize git, stage your clean file configuration, and commit:
```bash
# Initialize git repository
git init

# Stage all files (excluding node_modules/ & build outputs defined in .gitignore)
git add .

# Create the initial launch commit
git commit -m "feat: Initial commit of FeelBurn premium fitness app"
```

### 2. Publish to GitHub
1. Go to your [GitHub Account](https://github.com/) and click **New Repository**.
2. Name it `FeelBurn` (you can set it to Public or Private) and create. Do **not** initialize it with a README, gitignore, or license (these are already configured in this folder).
3. Copy the remote repository URL, then run:
   ```bash
   # Add remote destination link
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/FeelBurn.git

   # Set primary branch to main
   git branch -M main

   # Push codebase to online repository
   git push -u origin main
   ```

---

## 🤖 Step 4: Building & Deploying to the Google Play Store

We use **Expo Application Services (EAS Build)** to compile fully native binaries. Since we are building an Android `.aab` (Android App Bundle), Expo compiles the production binary entirely in the cloud, removing the need to configure complex Android Studio build environments on your computer.

### 1. Install EAS CLI
Install the global Expo command line tools:
```bash
npm install -g eas-cli
```

### 2. Log In to your Expo Developer Account
Create a free developer profile at [expo.dev](https://expo.dev) if you don't already have one, then authenticate in your terminal:
```bash
eas login
```

### 3. Configure EAS Build
Initialize the app configuration:
```bash
eas build:configure
```
- EAS will ask which platforms you'd like to configure. Select **Android** (or **All** if you plan to target iOS as well).
- This will generate a local configuration file named `eas.json` in the root folder, defining the build profiles.

### 4. Create your Google Play Developer Account
Register your publisher account on the [Google Play Console](https://play.google.com/console/signup) (Google requires a one-time $25 registration fee).

### 5. Compile Android App Bundle (.aab)
Trigger the automated production cloud build:
```bash
eas build --platform android --profile production
```
- **Expo Developer Credentials**: EAS will automatically generate or link a project slug inside your dashboard.
- **Android Keystore Generation**: EAS will ask if you want to generate a new Keystore. Select **Yes** (Expo will safely back up your Android keystore in their secure cloud, ensuring you can sign future updates easily).
- **Compilation**: EAS uploads your app configuration and compiles the code. This might take 10-15 minutes. Once done, it provides a download link for your compiled `.aab` file (e.g. `feelburn-production.aab`). Save this file to your computer.

### 6. Upload AAB to Google Play Console
1. Log in to your [Google Play Console](https://play.google.com/console/).
2. Click **Create app**, fill in:
   - **App Name**: FeelBurn
   - **Default Language**: English
   - **App Category**: App / Health & Fitness
   - **Pricing**: Free
3. Scroll to **Release** section in the side menu, go to **Testing > Closed testing** (or **Internal testing** for immediate testing with up to 100 internal developers).
4. Click **Create new release**.
5. Upload the downloaded `.aab` file.
6. Configure target questionnaires (Content Rating, Privacy Policy, target ages).
7. Submit the release for review! Google will review your AAB, after which it will be live on the Google Play Store!

---

## 🔧 Technical Details & Troubleshooting

- **Node Module Typings**: Standard React Native components are declared in `@/*` paths using the paths resolved by TypeScript in `tsconfig.json` for high-end structure.
- **State Flow**: The entry file `app/_layout.tsx` registers an auth observer. When you sign up or log in, it switches the layout smoothly to `(tabs)` and loads stats relative to the logged-in user profile, maintaining optimal performance.
- **Sound Effects**: Active workout notifications utilize default system vibrators and dynamic UI flashing, ensuring seamless performance inside the Expo Go sandboxed wrapper.

---

## 🏆 Project Architecture Authors
Created with high-performance styling principles and a visual-first layout logic by the **Antigravity AI Design & Engineering Team**. 🚀
