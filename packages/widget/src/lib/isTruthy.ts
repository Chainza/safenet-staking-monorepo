/**
 * `Array#filter` predicate that drops falsy entries and narrows the element
 * type to `NonNullable<T>` — so `[a, cond ? b : undefined].filter(isTruthy)`
 * yields a `T[]` rather than `(T | undefined)[]`.
 */
export function isTruthy<T>(value: T): value is NonNullable<T> {
  return Boolean(value);
}
