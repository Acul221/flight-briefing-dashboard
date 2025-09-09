// src/lib/guestMode.js
export function isForceGuest() {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("as") === "guest";
  } catch {
    return false;
  }
}
