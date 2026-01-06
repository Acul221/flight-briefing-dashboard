// src/utils/importer-v3/logger.js
// Minimal colored logger for importer pipelines.

const RESET = "\x1b[0m";
const COLORS = {
  info: "\x1b[36m",     // cyan
  warn: "\x1b[33m",     // yellow
  error: "\x1b[31m",    // red
  success: "\x1b[32m",  // green
};

const format = (args) => args.map((a) => (typeof a === "string" ? a : JSON.stringify(a)));

export function info(...args) {
  // eslint-disable-next-line no-console
  console.log(COLORS.info + "[INFO]" + RESET, ...format(args));
}

export function warn(...args) {
  // eslint-disable-next-line no-console
  console.warn(COLORS.warn + "[WARN]" + RESET, ...format(args));
}

export function error(...args) {
  // eslint-disable-next-line no-console
  console.error(COLORS.error + "[ERROR]" + RESET, ...format(args));
}

export function success(...args) {
  // eslint-disable-next-line no-console
  console.log(COLORS.success + "[OK]" + RESET, ...format(args));
}

export default { info, warn, error, success };
