// Selalu output "HH:mm"
export const toHHMM = (d) => d.toTimeString().slice(0,5);

// Parse "HH:mm" ke Date hari ini (atau baseDate)
export function parseHHMM(str, baseDate = new Date()) {
  if (!str) return null;
  const [h,m] = str.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

// Tambah menit dengan rollover aman
export function addMinutesHHMM(timeStr, offsetMin) {
  const d = parseHHMM(timeStr);
  if (!d || offsetMin == null) return "";
  d.setMinutes(d.getMinutes() + offsetMin);
  return toHHMM(d);
}

// Selisih menit actual - target (tanda + berarti telat)
// Handle midnight rollover dengan window toleransi 12 jam
export function diffMinutes(actualStr, targetStr) {
  if (!actualStr || !targetStr) return null;
  const a = parseHHMM(actualStr);
  const t = parseHHMM(targetStr);
  let diff = Math.round((a - t) / 60000); // menit
  if (diff > 720) diff -= 1440;      // contoh: 23:55 vs 00:05 (a jauh di depan)
  if (diff < -720) diff += 1440;     // contoh: 00:05 vs 23:55 (a “kemarin”)
  return diff;
}
