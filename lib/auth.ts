import { api } from "./api";
import { signInAndGetIdToken } from "./firebase";

/**
 * Firebase-style popup sign-in (it IS Firebase's signInWithPopup) → exchange
 * the ID token for our httpOnly session cookie.
 * Throws on popup-closed / provider errors — caller shows the message.
 */
export async function loginWithPopup(provider: "google" | "github"): Promise<void> {
  const idToken = await signInAndGetIdToken(provider);
  await api("/api/auth/session", { method: "POST", json: { idToken } });
}
