/**
 * Perform a prototype-agnostic deep object match.
 */
export function match(a: any, b: any): boolean;

/**
 * Perform a prototype-aware deep object match.
 */
export function strict<T>(a: T, b: T): boolean;
