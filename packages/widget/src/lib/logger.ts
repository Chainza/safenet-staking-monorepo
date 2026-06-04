const PREFIX = "[safe-stake-widget]";

/** Thin console wrapper that prefixes every widget log with the package name,
 *  so callers don't repeat the prefix. Use this instead of `console.*`. */
export const logger = {
  log: (...args: unknown[]) => console.log(PREFIX, ...args),
  info: (...args: unknown[]) => console.info(PREFIX, ...args),
  warn: (...args: unknown[]) => console.warn(PREFIX, ...args),
  error: (...args: unknown[]) => console.error(PREFIX, ...args),
};
