/**
 * Firebase-style popup sign-in without Firebase. Opens the OAuth flow in a
 * popup; the backend callback page posts { type: 'mm:auth' } to the opener and
 * closes itself. Popup blocked → full-page redirect fallback.
 */
export function loginWithPopup(
  provider: "google" | "github",
  onDone: () => void,
): void {
  const w = 500;
  const h = 650;
  const left = window.screenX + (window.outerWidth - w) / 2;
  const top = window.screenY + (window.outerHeight - h) / 2;
  const popup = window.open(
    `/api/auth/${provider}`,
    "mm-auth",
    `popup=1,width=${w},height=${h},left=${left},top=${top}`,
  );
  if (!popup) {
    window.location.href = `/api/auth/${provider}`;
    return;
  }

  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    window.removeEventListener("message", onMessage);
    clearInterval(poll);
    onDone();
  };
  const onMessage = (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    if ((e.data as { type?: string })?.type === "mm:auth") settle();
  };
  window.addEventListener("message", onMessage);
  // Fallback: user closed the popup manually (or COOP swallowed the message).
  const poll = setInterval(() => {
    if (popup.closed) settle();
  }, 500);
}
