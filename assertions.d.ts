/* tslint:disable */

import {Test} from "./core";

export type Key = string | number | symbol;

export type TypeofValue =
    "boolean" |
    "function" |
    "number" |
    "object" |
    "string" |
    "symbol" |
    "undefined";

export type Matcher = ((error: Error) => any) | string | RegExp;

export interface Assertions {
    assert(cond: boolean, message?: string): this;
    fail(message?: string): this;

    ok(cond: any): this;
    notOk(cond: any): this;

    boolean(object: any): this;
    notBoolean(object: any): this;

    function(object: any): this;
    notFunction(object: any): this;

    number(object: any): this;
    notNumber(object: any): this;

    object(object: any): this;
    notObject(object: any): this;

    string(object: any): this;
    notString(object: any): this;

    symbol(object: any): this;
    notSymbol(object: any): this;

    true(object: any): this;
    notTrue(object: any): this;

    false(object: any): this;
    notFalse(object: any): this;

    null(object: any): this;
    notNull(object: any): this;

    undefined(object: any): this;
    notUndefined(object: any): this;

    exists(object: any): this;
    notExists(object: any): this;

    array(object: any): this;
    notArray(object: any): this;

    type(object: any, type: TypeofValue): this;
    notType(object: any, type: TypeofValue): this;

    instanceof(object: any, Type: new (...args: any[]) => any): this;
    notInstanceof(object: any, Type: new (...args: any[]) => any): this;

    equal<T>(a: T, b: T): this;
    notEqual<T>(a: T, b: T): this;

    looseEqual(a: any, b: any): this;
    notLooseEqual(a: any, b: any): this;

    // Strict deep equal, taking into account types
    deepEqual<T>(a: T, b: T): this;
    notDeepEqual<T>(a: T, b: T): this;

    // Loose deep equal, ignoring types
    looseDeepEqual(a: Object, b: Object): this;
    notLooseDeepEqual(a: Object, b: Object): this;

    // deepEqual, but ignoring types
    match<T>(a: T, b: T): this;
    notMatch<T>(a: T, b: T): this;

    // alias of looseDeepEqual
    matchLoose(a: Object, b: Object): this;
    notMatchLoose(a: Object, b: Object): this;

    // has own property, possibly equal to a value
    hasOwn(object: Object, key: Key, value?: any): this;
    notHasOwn(object: Object, key: Key, value?: any): this;
    looseHasOwn(object: Object, key: Key, value?: any): this;
    notLooseHasOwn(object: Object, key: Key, value?: any): this;

    // has own or inherited property, possibly equal to a value
    hasKey(object: Object, key: Key, value?: any): this;
    notHasKey(object: Object, key: Key, value?: any): this;
    looseHasKey(object: Object, key: Key, value?: any): this;
    notLooseHasKey(object: Object, key: Key, value?: any): this;

    // throws, possibly of a specified type
    throws(func: () => any, Type?: new (...args: any[]) => any): this;
    notThrows(func: () => any, Type?: new (...args: any[]) => any): this;

    // throws, possibly satisfying a predicate function, having message
    // equal to a particular string, or having message that matches a
    // regular expression
    throwsMatch(func: () => any, matcher?: Matcher): this;
    notThrowsMatch(func: () => any, matcher?: Matcher): this;

    // Note: length comparisons always fail with NaNs.
    length(object: {length: number}, length: number): this;
    notLength(object: {length: number}, length: number): this;
    lengthAtLeast(object: {length: number}, length: number): this;
    lengthAtMost(object: {length: number}, length: number): this;
    lengthAbove(object: {length: number}, length: number): this;
    lengthBelow(object: {length: number}, length: number): this;

    // Note: these two always fail with NaNs, and the delta ignores sign.
    closeTo(actual: number, expected: number, delta: number): this;
    notCloseTo(actual: number, expected: number, delta: number): this;

    // includes list of values
    // strict equal
    includes<T>(array: T[], keys: T | T[]): this;
    notIncludesAll<T>(array: T[], keys: T | T[]): this;
    includesAny<T>(array: T[], keys: T | T[]): this;
    notIncludes<T>(array: T[], keys: T | T[]): this;

    // loose equal
    includesLoose<T>(array: T[], keys: T | T[]): this;
    notIncludesLooseAll<T>(array: T[], keys: T | T[]): this;
    includesLooseAny<T>(array: T[], keys: T | T[]): this;
    notIncludesLoose<T>(array: T[], keys: T | T[]): this;

    // strict deep equal
    includesDeep<T>(array: T[], keys: T | T[]): this;
    notIncludesDeepAll<T>(array: T[], keys: T | T[]): this;
    includesDeepAny<T>(array: T[], keys: T | T[]): this;
    notIncludesDeep<T>(array: T[], keys: T | T[]): this;

    // loose deep equal
    includesLooseDeep<T>(array: T[], keys: T | T[]): this;
    notIncludesLooseDeepAll<T>(array: T[], keys: T | T[]): this;
    includesLooseDeepAny<T>(array: T[], keys: T | T[]): this;
    notIncludesLooseDeep<T>(array: T[], keys: T | T[]): this;

    // structural deep equal
    includesMatch<T>(array: T[], keys: T | T[]): this;
    notIncludesMatchAll<T>(array: T[], keys: T | T[]): this;
    includesMatchAny<T>(array: T[], keys: T | T[]): this;
    notIncludesMatch<T>(array: T[], keys: T | T[]): this;

    // Alias for includesLooseDeep/etc.
    includesMatchLoose<T>(array: T[], keys: T | T[]): this;
    notIncludesMatchLooseAll<T>(array: T[], keys: T | T[]): this;
    includesMatchLooseAny<T>(array: T[], keys: T | T[]): this;
    notIncludesMatchLoose<T>(array: T[], keys: T | T[]): this;

    // match Object.keys(object) with list of keys
    hasKeys(object: Object, keys: Array<Key>): this;
    notHasAllKeys(object: Object, keys: Array<Key>): this;
    hasAnyKeys(object: Object, keys: Array<Key>): this;
    notHasKeys(object: Object, keys: Array<Key>): this;

    // match Object.keys(object) with keys
    // strict equal
    hasKeys(object: Object, keys: Object): this;
    notHasAllKeys(object: Object, keys: Object): this;
    hasAnyKeys(object: Object, keys: Object): this;
    notHasKeys(object: Object, keys: Object): this;

    // loose equal
    hasLooseKeys(object: Object, keys: Object): this;
    notHasLooseAllKeys(object: Object, keys: Object): this;
    hasLooseAnyKeys(object: Object, keys: Object): this;
    notHasLooseKeys(object: Object, keys: Object): this;

    // strict deep equal
    hasDeepKeys(object: Object, keys: Object): this;
    notHasDeepAllKeys(object: Object, keys: Object): this;
    hasDeepAnyKeys(object: Object, keys: Object): this;
    notHasDeepKeys(object: Object, keys: Object): this;

    // loose deep equal
    hasLooseDeepKeys(object: Object, keys: Object): this;
    notHasLooseDeepAllKeys(object: Object, keys: Object): this;
    hasLooseDeepAnyKeys(object: Object, keys: Object): this;
    notHasLooseDeepKeys(object: Object, keys: Object): this;

    // structural deep equal
    hasMatchKeys(object: Object, keys: Object): this;
    notHasMatchAllKeys(object: Object, keys: Object): this;
    hasMatchAnyKeys(object: Object, keys: Object): this;
    notHasMatchKeys(object: Object, keys: Object): this;

    // Aliases for hasLooseDeepKeys/etc.
    hasMatchLooseKeys(object: Object, keys: Object): this;
    notHasMatchLooseAllKeys(object: Object, keys: Object): this;
    hasMatchLooseAnyKeys(object: Object, keys: Object): this;
    notHasMatchLooseKeys(object: Object, keys: Object): this;
}

/**
 * Register these assertions.
 */
export default function plugin<T extends Test>(t: T): void;
