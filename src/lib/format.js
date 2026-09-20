export function formatCountdown(ms) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatExpiryLabel(msFromNow) {
  const h = msFromNow / 3600000;
  if (h <= 1.1) return "Vanishes in an hour";
  if (h <= 6.1) return "Lives for 6 hours";
  if (h <= 24.1) return "Lives for a day";
  return "Lives for 7 days";
}

const RECENT_KEY = "blinkchat.recent";
const ONBOARD_KEY = "blinkchat.onboarded";

export function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveRecent(entry) {
  const list = loadRecent().filter((r) => r.roomCode !== entry.roomCode);
  list.unshift({ ...entry, at: Date.now() });
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 6)));
}

export function clearRecent(code) {
  const list = loadRecent().filter((r) => r.roomCode !== code);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

export function isOnboarded() {
  return localStorage.getItem(ONBOARD_KEY) === "1";
}

export function setOnboarded() {
  localStorage.setItem(ONBOARD_KEY, "1");
}

export function haptic(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {}
}

export function initials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
