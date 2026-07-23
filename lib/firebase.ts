"use client";

import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// Public web config — safe to ship to the browser, but read from NEXT_PUBLIC_*
// env so it's not hardcoded (values are inlined at build time).
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);

/**
 * Firebase popup sign-in → short-lived ID token. The backend verifies it and
 * mints our own mm_session cookie; Firebase client state is not used after
 * this call.
 */
export async function signInAndGetIdToken(
  provider: "google" | "github",
): Promise<string> {
  let p;
  if (provider === "google") {
    p = new GoogleAuthProvider();
  } else {
    p = new GithubAuthProvider();
    // Ask GitHub for the user's email — without this scope, accounts with a
    // private email sign in with no email and land as an unlinked user.
    p.addScope("user:email");
  }
  const cred = await signInWithPopup(firebaseAuth, p);
  return cred.user.getIdToken();
}
