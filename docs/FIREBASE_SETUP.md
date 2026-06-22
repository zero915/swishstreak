# Firebase Setup for Swish Streak

Follow these steps to enable Google/Facebook login, friends, leaderboards, 1v1, and tournaments.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named **Swish Streak**
3. Enable Google Analytics (optional)

## 2. Register App

1. Add an **Android** app with package name: `com.bryan.swishstreak`
2. Download `google-services.json` (needed for standalone EAS builds, not Expo Go)
3. Copy the Firebase web config values

## 3. Enable Authentication

1. Go to **Authentication → Sign-in method**
2. Enable **Google** provider
3. Enable **Facebook** provider:
   - Create a [Meta Developer](https://developers.facebook.com) app
   - Add Facebook App ID and App Secret to Firebase
   - Set OAuth redirect URI from Firebase console
   - For Expo Go, add `exp://` redirect URIs per Expo auth session docs

## 4. Create Firestore Database

1. Go to **Firestore Database → Create database**
2. Start in **test mode** for development
3. Deploy rules from this repo:

```bash
firebase deploy --only firestore:rules
```

Rules live in [`firestore.rules`](../firestore.rules). Clients cannot write `totalCoins` or match state directly.

## 5. Deploy Cloud Functions

Competitive modes (1v1 betting, tournaments, bots, forfeits) require Cloud Functions.

From the project root (Firebase CLI is installed as a dev dependency):

```bash
npm install
npm run firebase:deploy
```

Or step by step:

```bash
cd functions && npm install && npm run build
cd .. && npx firebase deploy --only functions,firestore:rules
```

First-time setup: log in and link the project (`.firebaserc` uses `EXPO_PUBLIC_FIREBASE_PROJECT_ID`):

```bash
npx firebase login
```

Callable functions: `joinVersusQueue`, `leaveVersusQueue`, `submitVersusRound`, `joinTournament`  
Scheduled: `forfeitExpiredRounds` (hourly)

## 6. Configure Environment

Copy `.env.example` to `.env` and fill in values:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...   # Web client ID from Google Cloud Console
EXPO_PUBLIC_FACEBOOK_APP_ID=...
```

Restart Expo after changing `.env`:

```bash
npx expo start -c
```

## 7. Google OAuth for Expo Go

Use the **Web client ID** (not Android client) in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` for Expo Go testing.

For standalone Android builds, add your EAS keystore SHA-1 to Firebase console.

## 8. Location (Local Leaderboards)

The app uses `expo-location` for coarse country/region ranks. Add to `app.json` / `app.config` if needed:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Swish Streak uses your location to show local leaderboards."
        }
      ]
    ]
  }
}
```

## 9. Deep Links

- Friend invite: `swishstreak://invite/ABCDEF`
- Play link (share score): `swishstreak://play`

## 10. Guest Mode

The app works fully offline as a guest without Firebase configured. Social, versus, and tournament features show a sign-in prompt when Firebase is unavailable.
