const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Command Line Styling Colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  red: "\x1b[31m"
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(colors.bright + colors.cyan + query + colors.reset, resolve));
}

// Check if running on Windows or Unix to call correct npx command
const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

async function runCommand(args, inheritStdio = false) {
  return new Promise((resolve, reject) => {
    const fullArgs = ['firebase', ...args];
    
    const child = spawn(npxCmd, fullArgs, {
      stdio: inheritStdio ? 'inherit' : 'pipe',
      shell: true
    });

    let stdout = '';
    let stderr = '';

    if (!inheritStdio) {
      child.stdout.on('data', (data) => { stdout += data.toString(); });
      child.stderr.on('data', (data) => { stderr += data.toString(); });
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || stdout || `Command failed with exit code ${code}`));
      }
    });
  });
}

async function main() {
  log("\n=======================================================", colors.magenta);
  log(" 🔥 FeelBurn Firebase Automated Sync & Live Mode Setup 🔥", colors.bright + colors.magenta);
  log("=======================================================\n", colors.magenta);

  log("This tool will fully automate:", colors.bright);
  log("1. Authenticating with your Google account");
  log("2. Creating/selecting a Firebase project");
  log("3. Registering your Web application");
  log("4. Fetching the API keys & configuring your local .env file");
  log("\n-------------------------------------------------------\n");

  try {
    // Step 1: Firebase CLI Login
    log("[1/4] Authenticating with Google/Firebase...", colors.yellow);
    log("This will open a web browser. Please log in and authorize the Firebase CLI.", colors.cyan);
    await runCommand(['login'], true);
    log("✅ Authenticated successfully!\n", colors.green);

    // Step 2: Select or Create a Project
    log("[2/4] Selecting or Creating Firebase Project...", colors.yellow);
    const projAction = await askQuestion("Would you like to (C)reate a new project or (U)se an existing one? [C/U]: ");
    
    let projectId = '';
    
    if (projAction.trim().toUpperCase() === 'U') {
      log("\nFetching your Firebase projects...", colors.cyan);
      const listOutput = await runCommand(['projects:list']);
      console.log(listOutput);
      
      projectId = await askQuestion("\nEnter the exact Project ID you want to use: ");
      projectId = projectId.trim();
    } else {
      const randSuffix = Math.floor(100000 + Math.random() * 900000);
      const defaultProjId = `feelburn-app-${randSuffix}`;
      
      log(`\nAuto-generating a unique Project ID: ${defaultProjId}`, colors.cyan);
      const customId = await askQuestion(`Press Enter to accept or type a custom Project ID: `);
      projectId = customId.trim() || defaultProjId;

      log(`\nCreating project "${projectId}"... This can take up to 45 seconds.`, colors.yellow);
      await runCommand(['projects:create', projectId, '--display-name', 'FeelBurn'], true);
      log(`✅ Firebase project "${projectId}" created successfully!\n`, colors.green);
    }

    // Step 3: Register Web App
    log("[3/4] Registering Web Application...", colors.yellow);
    const appName = 'FeelBurnWeb';
    log(`Registering Web App "${appName}" under project "${projectId}"...`, colors.cyan);
    
    try {
      await runCommand(['apps:create', 'WEB', appName, '--project', projectId], true);
      log(`✅ Web App registered successfully!\n`, colors.green);
    } catch (e) {
      log(`⚠️ Notice: Web App registration returned an update or warning, moving to config fetch.`, colors.yellow);
    }

    // Step 4: Retrieve Config & Write .env
    log("[4/4] Extracting Firebase Config Keys & Saving...", colors.yellow);
    log("Fetching registered apps from Firebase...", colors.cyan);
    
    let sdkConfig = '';
    try {
      const appsListRaw = await runCommand(['apps:list', 'WEB', '--project', projectId, '--json']);
      const appsListData = JSON.parse(appsListRaw);
      
      if (appsListData && appsListData.result && appsListData.result.length > 0) {
        // Find our registered FeelBurnWeb app or pick the first one
        const webApp = appsListData.result.find(app => app.displayName === 'FeelBurnWeb') || appsListData.result[0];
        log(`Found app "${webApp.displayName}" with App ID: ${webApp.appId}`, colors.green);
        
        log("Fetching SDK config for this specific app...", colors.cyan);
        sdkConfig = await runCommand(['apps:sdkconfig', 'WEB', webApp.appId, '--project', projectId]);
      } else {
        log("No Web Apps found in project list, trying default configuration...", colors.yellow);
        sdkConfig = await runCommand(['apps:sdkconfig', 'WEB', '--project', projectId]);
      }
    } catch (err) {
      log(`⚠️ Notice: Failed to retrieve specific app list. Trying standard fallback config...`, colors.yellow);
      sdkConfig = await runCommand(['apps:sdkconfig', 'WEB', '--project', projectId]);
    }
    
    // Parse SDK Config (Try JSON first, fallback to regex)
    let config = null;

    try {
      const parsed = JSON.parse(sdkConfig.trim());
      if (parsed && parsed.apiKey && parsed.projectId && parsed.appId) {
        config = {
          apiKey: parsed.apiKey,
          authDomain: parsed.authDomain || `${parsed.projectId}.firebaseapp.com`,
          projectId: parsed.projectId,
          storageBucket: parsed.storageBucket || `${parsed.projectId}.appspot.com`,
          messagingSenderId: parsed.messagingSenderId || '',
          appId: parsed.appId
        };
      }
    } catch (e) {
      // Not JSON, fallback to Regex matching
    }

    if (!config) {
      const apiKeyMatch = sdkConfig.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = sdkConfig.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = sdkConfig.match(/projectId:\s*["']([^"']+)["']/);
      const storageBucketMatch = sdkConfig.match(/storageBucket:\s*["']([^"']+)["']/);
      const messagingSenderIdMatch = sdkConfig.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const appIdMatch = sdkConfig.match(/appId:\s*["']([^"']+)["']/);

      if (apiKeyMatch && projectIdMatch && appIdMatch) {
        config = {
          apiKey: apiKeyMatch[1],
          authDomain: authDomainMatch ? authDomainMatch[1] : `${projectId}.firebaseapp.com`,
          projectId: projectIdMatch[1],
          storageBucket: storageBucketMatch ? storageBucketMatch[1] : `${projectId}.appspot.com`,
          messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : '',
          appId: appIdMatch[1]
        };
      }
    }

    if (config) {
      // Write to .env
      const envPath = path.join(__dirname, '..', '.env');
      const envContent = `# FeelBurn App - Firebase Environment Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=${config.apiKey}
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=${config.authDomain}
EXPO_PUBLIC_FIREBASE_PROJECT_ID=${config.projectId}
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=${config.storageBucket}
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId}
EXPO_PUBLIC_FIREBASE_APP_ID=${config.appId}
`;

      fs.writeFileSync(envPath, envContent);
      log("✅ Local .env file updated successfully with your live credentials!", colors.green);
      log(`Configured keys:`, colors.bright);
      console.log(config);
    } else {
      throw new Error("Could not parse the SDK Config output from Firebase CLI. Output was:\n" + sdkConfig);
    }

    log("\n=======================================================", colors.green);
    log(" 🎉 Firebase is Fully Configured in Live Mode! 🎉", colors.bright + colors.green);
    log("=======================================================\n", colors.green);
    
    log("🚀 IMPORTANT ACTION REQUIRED:", colors.bright + colors.yellow);
    log("Since Authentication and Firestore need default cloud database allocations,");
    log("please click these 2 links to enable them on your new project console in 10 seconds:\n", colors.cyan);
    log(`1. Enable Email/Password Auth: https://console.firebase.google.com/project/${projectId}/authentication/providers`, colors.bright + colors.cyan);
    log(`2. Enable Firestore DB: https://console.firebase.google.com/project/${projectId}/firestore`, colors.bright + colors.cyan);
    log("\nOnce you click those, restart the development server:");
    log("  npx expo start -c", colors.bright);

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.bright + colors.red);
  } finally {
    rl.close();
  }
}

main();
