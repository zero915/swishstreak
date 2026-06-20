# Firebase Setup for Swish Streak

Follow these steps to enable Google/Facebook login, friends, and leaderboards.

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

## 4. Create Firestore Database

1. Go to **Firestore Database → Create database**
2. Start in **test mode** for development
3. Replace with proper security rules before production:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /leaderboards/{boardId}/entries/{entryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == entryId;
    }
  }
}
```

## 5. Configure Environment

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

## 6. Google OAuth for Expo Go

Use the **Web client ID** (not Android client) in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` for Expo Go testing.

For standalone Android builds, add your EAS keystore SHA-1 to Firebase console.

## 7. Guest Mode

The app works fully offline as a guest without Firebase configured. Social features show a sign-in prompt when Firebase is unavailable.
