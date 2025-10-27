// Utility helpers shared across admin question normalization/validation.

/**
 * Convert free-form text into a URL-safe slug.
 *
 * @example slugify("A320 Systems") // "a320-systems"
 * @example slugify("Café Ops!") // "cafe-ops"
 * @param {string} str
 * @returns {string}
 */
export function slugify(str) {
  if (str == null) return "";
  const normalized = String(str)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const compact = normalized.replace(/[^a-z0-9]+/g, "-");
  return compact.replace(/^-+|-+$/g, "");
}

const ANSWER_MAP = { A: 0, B: 1, C: 2, D: 3 };

/**
 * Normalize various answer key formats into a zero-based index (0..3).
 *
 * @example mapAnswerKey("b") // 1
 * @example mapAnswerKey("  D ") // 3
 * @example mapAnswerKey(2) // 2
 * @param {string|number|null|undefined} key
 * @returns {number|null}
 */
export function mapAnswerKey(key) {
  if (key == null) return null;
  if (typeof key === "number" && Number.isInteger(key) && key >= 0 && key <= 3) {
    return key;
  }

  const trimmed = String(key).trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const num = Number(trimmed);
    return num >= 0 && num <= 3 ? num : null;
  }

  const letter = trimmed.toUpperCase();
  return Object.prototype.hasOwnProperty.call(ANSWER_MAP, letter) ? ANSWER_MAP[letter] : null;
}

const SPLIT_REGEX = /[,\s/;|]+/;

/**
 * Parse a list of aircraft identifiers from string or array input.
 *
 * @example parseAircraft("A320, a330 / A321") // ["A320","A330","A321"]
 * @example parseAircraft(["a320", " A321 "]) // ["A320","A321"]
 * @param {string|string[]|null|undefined} raw
 * @returns {string[]}
 */
export function parseAircraft(raw) {
  const result = [];
  const push = (value) => {
    const token = String(value ?? "")
      .trim()
      .toUpperCase();
    if (!token) return;
    if (!result.includes(token)) result.push(token);
  };

  if (Array.isArray(raw)) {
    raw.forEach(push);
    return result;
  }

  if (typeof raw === "string") {
    raw
      .split(SPLIT_REGEX)
      .filter(Boolean)
      .forEach(push);
    return result;
  }

  return result;
}

/**
 * Safely stringify objects, guarding against circular references.
 *
 * @example safeStringify({ a: 1 }) // "{\n  \"a\": 1\n}"
 * @param {any} value
 * @returns {string}
 */
export function safeStringify(value) {
  const seen = new WeakSet();
  const replacer = (_key, val) => {
    if (typeof val === "object" && val !== null) {
      if (seen.has(val)) {
        return "[Circular]";
      }
      seen.add(val);
    }
    return val;
  };
  return JSON.stringify(value, replacer, 2);
}
