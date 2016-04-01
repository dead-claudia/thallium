/* tslint:disable */

declare module "techtonic/core" {
    interface NestedArray<T> extends Array<T> {}
    type Nested<T> = T | NestedArray<T>;

    type Callback = (err?: Error) => any;

    type TestType =
        "start" | "end" | "pass" | "fail" | "pending" | "exit" | "extra";

    export interface TestLocation {
        name: string;
        index: number;
    }

    export interface TestReport<T extends TestType, U> {
        type: T;
        value: U;
        path: TestLocation[];
    }

    export interface ExtraReportData {
        count: number;
        value: any;
    }

    export interface StartReport extends TestReport<"start", void> {}
    export interface EndReport extends TestReport<"end", void> {}
    export interface PassReport extends TestReport<"pass", void> {}
    export interface FailReport extends TestReport<"fail", any> {}
    export interface PendingReport extends TestReport<"pending", void> {}
    export interface ExitReport extends TestReport<"exit", void> {}
    export interface ExtraReport extends TestReport<"extra", ExtraReportData> {}

    export interface Reporter {
        (item: TestReport<TestType, any>, done: (err?: Error) => void): any;

        // Whether this needs to block everything else. Useful if you need to
        // have sole access of a resource, and you can't get a lock for it.
        block?: boolean;
    }

    export interface AssertionResult {
        [key: string]: any;

        // These are required.
        test: boolean;
        message: string;

        // These are optional, but will be added to the assertion error if the
        // `test` returns false.
        actual?: any;
        expected?: any;
    }

    type AsyncDone = (err?: Error) => void;
    type Plugin = (t: Test) => any;

    export interface AssertionErrorJson {
        name: string;
        message: string;
        expected: any;
        actual: any;
        stack?: string;
    }

    export class AssertionError extends Error {
        name: string;

        message: string;
        expected: any;
        found: any;

        constructor(message: string, expected: any, actual: any);

        toJSON(includeStack?: boolean): AssertionErrorJson;
    }

    type AssertionErrorConstructor =
        new (message: string, expected: any, actual: any) => AssertionError;

    type IteratorResult = {
        done: boolean;
        value: any;
    }

    type Iterator = {
        next(value?: any): IteratorResult;
        return?(value?: any): IteratorResult;
        throw?(err?: any): IteratorResult;
    }

    type Thenable = {
        then(resolve: (value: any) => void, reject: (value: any) => void): any;
    }

    type ObjectMap<T> = {
        [name: string]: T;
    }

    type WrapperImpl = (f: (...args: any[]) => any, ...args: any[]) => any;

    export interface Test {
        AssertionError: AssertionErrorConstructor;

        // Exposed for testing, but might be interesting for consumers.
        base(): Test;

        // Only run tests that match these selectors.
        only(...selectors: string[][]): this;

        // Use one or more plugins.
        use(...plugins: Nested<Plugin>[]): this;

        // Add one or more reporters.
        reporter(...reporters: Nested<Reporter>[]): this;

        // Get a list of all reporters used for this instance.
        reporters(): Reporter[];

        // Define one or more assertion methods on this instance. All the
        // tracking of errors, even in inline tests, are automatically taken
        // care of. `checkInit()` is also called here, so you don't have to.
        //
        // This is also used internally to define the built-in assertions very
        // concisely.
        define(name: string, impl: (...args: any[]) => AssertionResult): this;
        define(methods: ObjectMap<(...args: any[]) => AssertionResult>): this;

        // Wrap one or more methods on this instance.
        wrap(name: string, impl: WrapperImpl): this;
        wrap(methods: ObjectMap<WrapperImpl>): this;

        // Add one or more methods on this instance. The first argument and
        // `this` both reference the current instance, and the rest are the
        // other arguments.
        add(name: string, impl: (test: this, ...args: any[]) => any): this;
        add(methods: ObjectMap<(test: this, ...args: any[]) => any>): this;

        // Get the parent test. Exposed for plugins.
        parent(): Test;

        // Set the timeout for async tests.
        timeout(timeout: number): this;

        // Get the current timeout. If this returns 0, then it inherits from the
        // parent.
        timeout(): number;

        // Ensure this is within the initialization stage. This should *always*
        // be used by plugin authors if a test method can modify state or throw
        // an exception during normal execution. If you use `define`, `wrap` or
        // `add`, this is already done for you.
        checkInit(): this;

        // Run the tests. This is the only void-returning function that doesn't
        // return the current instance instead, since chaining is probably a
        // mistake.
        run(callback: (err?: Error) => any): void;

        // New shorthand sync test, use testSkip to skip it.
        test(name: string): Test;
        testSkip(name: string): Test;

        // New sync test, returns the current instance, use testSkip to skip it.
        test(name: string, run: (test: this) => any): this;
        testSkip(name: string, run: (test: this) => any): this;

        // Define an async test. This may return a promise, a generator, or call
        // `done` with a possible error. Use asyncSkip to skip it.
        async(name: string, run: (test: this, done: AsyncDone) => any): this;
        async(name: string, run: (test: this) => Thenable): this;
        async(name: string, run: (test: this) => Iterator): this;

        asyncSkip(name: string, run: (test: this, done: AsyncDone) => any): this;
        asyncSkip(name: string, run: (test: this) => Thenable): this;
        asyncSkip(name: string, run: (test: this) => Iterator): this;

        // Run a block when assertions are run. This exists primarily for
        // inline tests, in case they have specific setup to do.
        do(func: () => any): this;
        block(func: () => any): this;
    }

    var base: Test;
    export default base;
}

declare module "techtonic/assertions" {
    import {Test} from "techtonic/core";

    type Key = string | number | symbol;

    type TypeofValue =
        "boolean" |
        "function" |
        "number" |
        "object" |
        "string" |
        "symbol" |
        "undefined";

    type Matcher = ((error: any) => any) | string | RegExp;

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

        looseEqual<T>(a: T, b: T): this;
        notLooseEqual<T>(a: T, b: T): this;

        // Strict deep equal, taking into account types
        deepEqual<T>(a: T, b: T): this;
        notDeepEqual<T>(a: T, b: T): this;

        // Loose deep equal, ignoring types
        looseDeepEqual(a: Object, b: Object): this;
        notLooseDeepEqual(a: Object, b: Object): this;

        // deepEqual, but ignoring types
        match(a: Object, b: Object): this;
        notMatch(a: Object, b: Object): this;

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
        includes<T>(array: T[], keys: T | T[]): this;
        notIncludesAll<T>(array: T[], keys: T | T[]): this;
        includesAny<T>(array: T[], keys: T | T[]): this;
        notIncludes<T>(array: T[], keys: T | T[]): this;

        includesLoose<T>(array: T[], keys: T | T[]): this;
        notIncludesLooseAll<T>(array: T[], keys: T | T[]): this;
        includesLooseAny<T>(array: T[], keys: T | T[]): this;
        notIncludesLoose<T>(array: T[], keys: T | T[]): this;

        includesDeep<T>(array: T[], keys: T | T[]): this;
        notIncludesDeepAll<T>(array: T[], keys: T | T[]): this;
        includesDeepAny<T>(array: T[], keys: T | T[]): this;
        notIncludesDeep<T>(array: T[], keys: T | T[]): this;

        includesLooseDeep<T>(array: T[], keys: T | T[]): this;
        notIncludesLooseDeepAll<T>(array: T[], keys: T | T[]): this;
        includesLooseDeepAny<T>(array: T[], keys: T | T[]): this;
        notIncludesLooseDeep<T>(array: T[], keys: T | T[]): this;

        includesMatchLoose<T>(array: T[], keys: T | T[]): this;
        notIncludesMatchLooseAll<T>(array: T[], keys: T | T[]): this;
        includesMatchLooseAny<T>(array: T[], keys: T | T[]): this;
        notIncludesMatchLoose<T>(array: T[], keys: T | T[]): this;

        includesMatch<T>(array: T[], keys: T | T[]): this;
        notIncludesMatchAll<T>(array: T[], keys: T | T[]): this;
        includesMatchAny<T>(array: T[], keys: T | T[]): this;
        notIncludesMatch<T>(array: T[], keys: T | T[]): this;

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
    export default function plugin(t: Test): void;
}

declare module "techtonic" {
    import {Test as CoreTest} from "techtonic/core";

    export {
        AssertionError,
        AssertionErrorJson,
        TestLocation,
        TestReport,
        ExtraReportData,
        StartReport,
        EndReport,
        PassReport,
        FailReport,
        PendingReport,
        ExitReport,
        ExtraReport,
        Reporter,
        AssertionResult,
    } from "techtonic/core";

    import {Assertions} from "techtonic/assertions";

    export interface Test extends CoreTest, Assertions {}

    var base: Test;
    export default base;
}

declare module "techtonic/index" {
    export * from "techtonic";
    export {default as default} from "techtonic";
}
