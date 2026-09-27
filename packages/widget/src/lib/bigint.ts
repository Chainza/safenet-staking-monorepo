/**
 * `0n` / `1n` as module-scope constants.
 *
 * React Compiler 1.0 can't lower `BigIntLiteral` nodes: it silently bails out of
 * the entire component or hook containing one, leaving it unmemoized. So bigint
 * literals must never be written inline inside a component/hook — import these
 * (or hoist the literal to module scope, where the compiler never looks).
 * Plain, non-React functions are unaffected. Drop this once the compiler
 * supports bigint literals.
 */
export const ZERO = 0n;
export const ONE = 1n;
