import { api } from "./api";
import { signInAndGetIdToken } from "./firebase";

/**
 * Firebase-style popup sign-in (it IS Firebase's signInWithPopup) → exchange
 * the ID token for our httpOnly session cookie.
 * Throws on popup-closed / provider errors — caller shows the message.
 */
export async function loginWithPopup(provider: "google" | "github"): Promise<void> {
  let idToken: string;
  try {
    idToken = await signInAndGetIdToken(provider);
  } catch (e) {
    // Firebase blocks a second provider on the same email unless the project
    // enables "Multiple accounts per email". Give a human message either way.
    if ((e as { code?: string }).code === "auth/account-exists-with-different-credential") {
      const other = provider === "github" ? "Google" : "GitHub";
      throw new Error(
        `This email is already registered via ${other} — sign in with ${other} instead.`,
      );
    }
    throw e;
  }
  await api("/api/auth/session", { method: "POST", json: { idToken } });
}
