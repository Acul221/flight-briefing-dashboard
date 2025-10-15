export const formatDateTime = (d, opts = {}) =>
  new Date(d).toLocaleString(undefined, { hour12: false, ...opts });

export const formatDate = (d, opts = {}) =>
  new Date(d).toLocaleDateString(undefined, opts);

export const mmss = (s = 0) => {
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${String(m).padStart(2, '0')}:${sec}`;
};
