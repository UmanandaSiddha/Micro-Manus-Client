"use client";

import { getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  GithubAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

// Public web config — safe to ship to the browser.
const firebaseConfig = {
  apiKey: "AIzaSyARH9JxXfqiIFRV8Cj0jcFw170Oj1nicX0",
  authDomain: "micro-manus-c5b2a.firebaseapp.com",
  projectId: "micro-manus-c5b2a",
  storageBucket: "micro-manus-c5b2a.firebasestorage.app",
  messagingSenderId: "124781543405",
  appId: "1:124781543405:web:d57ec1dc55f2eaef1eb1e4",
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
  const p =
    provider === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();
  const cred = await signInWithPopup(firebaseAuth, p);
  return cred.user.getIdToken();
}
