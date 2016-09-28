/* tslint:disable */

import {Test} from "./core";

export type Key = string | number | symbol;
export type ObjectMap<T> = {[key: Key]: T};

export function format(message: string, args: ObjectMap<any>): string;

export class AssertionError extends Error {
    name: "AssertionError";
    message: string;
    expected: any;
    found: any;
    constructor(message: string, expected: any, actual: any);
}

export function assert(cond: boolean, message?: string): void;
export function fail(message?: string, expected?: any, actual?: any): void;
export function failFormat(message: string, args: ObjectMap<any>): void;

export function ok(cond: any): void;
export function notOk(cond: any): void;

export function boolean(object: any): void;
export function notBoolean(object: any): void;

export function function(object: any): void;
export function notFunction(object: any): void;

export function number(object: any): void;
export function notNumber(object: any): void;

export function object(object: any): void;
export function notObject(object: any): void;

export function string(object: any): void;
export function notString(object: any): void;

export function symbol(object: any): void;
export function notSymbol(object: any): void;

export function exists(object: any): void;
export function notExists(object: any): void;

export function array(object: any): void;
export function notArray(object: any): void;

export type TypeofValue =
    "boolean" |
    "function" |
    "number" |
    "object" |
    "string" |
    "symbol" |
    "undefined";

export function type(object: any, type: TypeofValue): void;
export function notType(object: any, type: TypeofValue): void;

export function inherits(object: any, Type: new (...args: any[]) => any): void;
export function notInherits(object: any, Type: new (...args: any[]) => any): void;

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
export function hasOwn(object: Object, key: Key, value?: any): void;
export function notHasOwn(object: Object, key: Key, value?: any): void;
export function hasOwnLoose(object: Object, key: Key, value: any): void;
export function notHasOwnLoose(object: Object, key: Key, value: any): void;

// has own or inherited property, possibly equal to a value
export function hasKey(object: Object, key: Key, value?: any): void;
export function notHasKey(object: Object, key: Key, value?: any): void;
export function hasKeyLoose(object: Object, key: Key, value: any): void;
export function notHasKeyLoose(object: Object, key: Key, value: any): void;

// has in collection (e.g. Map)
export interface MapLike<T, U> {
    has(value: T): boolean;
    get(value: T): U;
}

export function has<T, U>(object: MapLike<T, U>, key: T, value?: U): void;
export function notHas<T, U>(object: MapLike<T, U>, key: T, value?: U): void;
export function hasLoose<T, U>(object: MapLike<T, U>, key: T, value: U): void;
export function notHasLoose<T, U>(object: MapLike<T, U>, key: T, value: U): void;

// throws, possibly of a specified type
export function throws(func: () => any, Type?: new (...args: any[]) => any): void;
export function notThrows(func: () => any, Type?: new (...args: any[]) => any): void;

// throws, possibly satisfying a predicate function, having message
// equal to a particular string, or having message that matches a
// regular expression
export type Matcher = ((error: Error) => any) | string | RegExp;

export function throwsMatch(func: () => any, matcher?: Matcher): void;
export function notThrowsMatch(func: () => any, matcher?: Matcher): void;

// Note: length comparisons always fail with NaNs.
export function length(object: {length: number}, length: number): void;
export function notLength(object: {length: number}, length: number): void;
export function lengthAtLeast(object: {length: number}, length: number): void;
export function lengthAtMost(object: {length: number}, length: number): void;
export function lengthAbove(object: {length: number}, length: number): void;
export function lengthBelow(object: {length: number}, length: number): void;

// Note: these two always fail with NaNs, and the delta ignores sign.
export function closeTo(actual: number, expected: number, delta: number): void;
export function notCloseTo(actual: number, expected: number, delta: number): void;

// includes list of values
// strict equal
export function includes<T>(array: T[], keys: T | T[]): void;
export function notIncludesAll<T>(array: T[], keys: T | T[]): void;
export function includesAny<T>(array: T[], keys: T | T[]): void;
export function notIncludes<T>(array: T[], keys: T | T[]): void;

// loose equal
export function includesLoose<T>(array: T[], keys: T | T[]): void;
export function notIncludesLooseAll<T>(array: T[], keys: T | T[]): void;
export function includesLooseAny<T>(array: T[], keys: T | T[]): void;
export function notIncludesLoose<T>(array: T[], keys: T | T[]): void;

// strict deep equal
export function includesDeep<T>(array: T[], keys: T | T[]): void;
export function notIncludesDeepAll<T>(array: T[], keys: T | T[]): void;
export function includesDeepAny<T>(array: T[], keys: T | T[]): void;
export function notIncludesDeep<T>(array: T[], keys: T | T[]): void;

// structural deep equal
export function includesMatch<T>(array: T[], keys: T | T[]): void;
export function notIncludesMatchAll<T>(array: T[], keys: T | T[]): void;
export function includesMatchAny<T>(array: T[], keys: T | T[]): void;
export function notIncludesMatch<T>(array: T[], keys: T | T[]): void;

// match Object.keys(object) with list of keys
// strict equal
export function hasKeys(object: Object, keys: Key[]): void;
export function notHasAllKeys(object: Object, keys: Key[]): void;
export function hasAnyKeys(object: Object, keys: Key[]): void;
export function notHasKeys(object: Object, keys: Key[]): void;

// loose equal
export function hasLooseKeys(object: Object, keys: Key[]): void;
export function notHasLooseAllKeys(object: Object, keys: Key[]): void;
export function hasLooseAnyKeys(object: Object, keys: Key[]): void;
export function notHasLooseKeys(object: Object, keys: Key[]): void;

// match Object.keys(object) with keys
// strict equal
export function hasKeys(object: Object, keys: ObjectMap<any>): void;
export function notHasAllKeys(object: Object, keys: ObjectMap<any>): void;
export function hasAnyKeys(object: Object, keys: ObjectMap<any>): void;
export function notHasKeys(object: Object, keys: ObjectMap<any>): void;

// loose equal
export function hasLooseKeys(object: Object, keys: ObjectMap<any>): void;
export function notHasLooseAllKeys(object: Object, keys: ObjectMap<any>): void;
export function hasLooseAnyKeys(object: Object, keys: ObjectMap<any>): void;
export function notHasLooseKeys(object: Object, keys: ObjectMap<any>): void;

// strict deep equal
export function hasDeepKeys(object: Object, keys: ObjectMap<any>): void;
export function notHasDeepAllKeys(object: Object, keys: ObjectMap<any>): void;
export function hasDeepAnyKeys(object: Object, keys: ObjectMap<any>): void;
export function notHasDeepKeys(object: Object, keys: ObjectMap<any>): void;

// structural deep equal
export function hasMatchKeys(object: Object, keys: ObjectMap<any>): void;
export function notHasMatchAllKeys(object: Object, keys: ObjectMap<any>): void;
export function hasMatchAnyKeys(object: Object, keys: ObjectMap<any>): void;
export function notHasMatchKeys(object: Object, keys: ObjectMap<any>): void;
