/* tslint:disable */

export type Key = string | number | symbol;
export type ObjectMap<T> = {[key: string]: T} | {[key: number]: T};
export function assert(condition: any, message?: string): void;

export class AssertionError extends Error {
    name: "AssertionError";
    message: string;
    expected: any;
    actual: any;
    constructor(message?: string, expected?: any, actual?: any);
}

export function format(message: string, args: ObjectMap<any>, prettify?: (value: any) => string): string;
export function escape(message: string): string;
export function fail(message: string): void;
export function fail(message: string, args: ObjectMap<any>, prettify?: (value: any) => string): void;

export function ok(value: any): void;
export function notOk(value: any): void;

export function isBoolean(object: any): void;
export function notBoolean(object: any): void;

export function isFunction(object: any): void;
export function notFunction(object: any): void;

export function isNumber(object: any): void;
export function notNumber(object: any): void;

export function isObject(object: any): void;
export function notObject(object: any): void;

export function isString(object: any): void;
export function notString(object: any): void;

export function isSymbol(object: any): void;
export function notSymbol(object: any): void;

export function exists(object: any): void;
export function notExists(object: any): void;

export function isArray(object: any): void;
export function notArray(object: any): void;

export function is(Type: new (...args: any[]) => any, object: any): void;
export function not(Type: new (...args: any[]) => any, object: any): void;

export function equal<T>(a: T, b: T): void;
export function notEqual<T>(a: T, b: T): void;

export function atLeast(n: number, limit: number): void;
export function atMost(n: number, limit: number): void;
export function above(n: number, limit: number): void;
export function below(n: number, limit: number): void;
export function between(n: number, lower: number, upper: number): void;

export function equalLoose(a: any, b: any): void;
export function notEqualLoose(a: any, b: any): void;

// Strict deep equality, checking prototypes as well
export function deepEqual<T>(a: T, b: T): void;
export function notDeepEqual<T>(a: T, b: T): void;

// Purely structural deep equality
export function match<T>(a: T, b: T): void;
export function notMatch<T>(a: T, b: T): void;

// has own property, possibly equal to a value
export function hasOwn(object: Object, key: Key): void;
export function notHasOwn(object: Object, key: Key): void;

export function hasOwn(object: Object, key: Key, value: any): void;
export function notHasOwn(object: Object, key: Key, value: any): void;
export function hasOwnLoose(object: Object, key: Key, value: any): void;
export function notHasOwnLoose(object: Object, key: Key, value: any): void;

// has own or inherited property, possibly equal to a value
export function hasKey(object: Object, key: Key): void;
export function notHasKey(object: Object, key: Key): void;

export function hasKey(object: Object, key: Key, value: any): void;
export function notHasKey(object: Object, key: Key, value: any): void;
export function hasKeyLoose(object: Object, key: Key, value: any): void;
export function notHasKeyLoose(object: Object, key: Key, value: any): void;

// has in collection (e.g. Map)
export interface MapLike<T, U> {
    has(value: T): boolean;
    get(value: T): U;
}

export function has<T>(object: MapLike<T, any>, key: T): void;
export function notHas<T>(object: MapLike<T, any>, key: T): void;

export function has<T, U>(object: MapLike<T, U>, key: T, value: U): void;
export function notHas<T, U>(object: MapLike<T, U>, key: T, value: U): void;
export function hasLoose<T, U>(object: MapLike<T, U>, key: T, value: U): void;
export function notHasLoose<T, U>(object: MapLike<T, U>, key: T, value: U): void;

// throws, possibly of a specified type
export function throws(func: () => any): void;
export function throws(Type: new (...args: any[]) => any, func: () => any): void;

// throws, possibly satisfying a predicate function, having message
// equal to a particular string, or having message that matches a
// regular expression
export type Matcher = ((error: Error) => any) | string | RegExp | {[key: string]: any};

export function throwsMatch(matcher: Matcher, func: () => any): void;

// Note: these two always fail with NaNs, and the delta ignores sign.
export function closeTo(actual: number, expected: number, epsilon?: number): void;
export function notCloseTo(actual: number, expected: number, epsilon?: number): void;

// includes list of values
// includes all
export function includes<T>(array: T[], values: T | T[]): void;
export function includesDeep<T>(array: T[], values: T | T[]): void;
export function includesMatch<T>(array: T[], values: T | T[]): void;

// includes some
export function includesAny<T>(array: T[], values: T[]): void;
export function includesDeepAny<T>(array: T[], values: T[]): void;
export function includesMatchAny<T>(array: T[], values: T[]): void;

// missing some
export function notIncludesAll<T>(array: T[], values: T[]): void;
export function notIncludesDeepAll<T>(array: T[], values: T[]): void;
export function notIncludesMatchAll<T>(array: T[], values: T[]): void;

// missing all
export function notIncludes<T>(array: T[], values: T[]): void;
export function notIncludesDeep<T>(array: T[], values: T[]): void;
export function notIncludesMatch<T>(array: T[], values: T[]): void;

// match Object.keys(object) with list of keys
export function hasKeys(object: Object, keys: Key[]): void;
export function notHasKeysAll(object: Object, keys: Key[]): void;
export function hasKeysAny(object: Object, keys: Key[]): void;
export function notHasKeys(object: Object, keys: Key[]): void;

// match Object.keys(object) with keys
// includes all
export function hasKeys(object: Object, keys: ObjectMap<any>): void;
export function hasKeysMatch(object: Object, keys: ObjectMap<any>): void;
export function hasKeysDeep(object: Object, keys: ObjectMap<any>): void;

// includes some
export function hasKeysAny(object: Object, keys: ObjectMap<any>): void;
export function hasKeysAnyDeep(object: Object, keys: ObjectMap<any>): void;
export function hasKeysAnyMatch(object: Object, keys: ObjectMap<any>): void;

// missing some
export function notHasKeysAll(object: Object, keys: ObjectMap<any>): void;
export function notHasKeysAllDeep(object: Object, keys: ObjectMap<any>): void;
export function notHasKeysAllMatch(object: Object, keys: ObjectMap<any>): void;

// missing all
export function notHasKeys(object: Object, keys: ObjectMap<any>): void;
export function notHasKeysMatch(object: Object, keys: ObjectMap<any>): void;
export function notHasKeysDeep(object: Object, keys: ObjectMap<any>): void;
