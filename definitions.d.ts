/* tslint:disable */

declare module "techtonic/core" {
    interface NestedArray<T> extends Array<T> {}
    type Nested<T> = T | NestedArray<T>;

    type Callback = (err?: Error) => any;

    export interface ParentData {
        name: string;
        index: number;
        parent: ParentData | void;
    }

    export interface StartReport {
        type: "start";
        value: void;
        name: string;
        index: number;
        parent: ParentData | void;
    }

    export interface EndReport {
        type: "end";
        value: void;
        name: string;
        index: number;
        parent: ParentData | void;
    }

    export interface PassReport {
        type: "pass";
        value: void;
        name: string;
        index: number;
        parent: ParentData | void;
    }

    export interface FailReport {
        type: "fail";
        value: any;
        name: string;
        index: number;
        parent: ParentData | void;
    }

    export interface PendingReport {
        type: "pending";
        value: void;
        name: string;
        index: number;
        parent: ParentData | void;
    }

    export interface ExitReport {
        type: "exit";
        value: void;
        name: string;
        index: number;
        parent: void;
    }

    export interface ExtraReportEntry {
        name: string;
        index: number;
    }

    export interface ExtraReportValue {
        count: number;
        value: any;
    }

    export interface ExtraReport {
        type: "extra";
        name: string;
        value: ExtraReportValue;
        index: number;
        parent: ExtraReportEntry[];
    }

    type TestReport =
        StartReport |
        EndReport |
        ExitReport |
        PassReport |
        FailReport |
        ExtraReport;

    export interface Reporter {
        (item: TestReport, done: (err?: Error) => void): any;

        // Whether this needs to block everything else. Useful if you need to
        // have sole access of a resource, and you can't get a lock for it.
        block?: boolean;
    }

    export interface TestResult {
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
        stack: string | void;
    }

    export interface AssertionErrorJsonWithStack extends AssertionErrorJson {
        stack: string | void;
    }

    export class AssertionError extends Error {
        message: string;
        expected: any;
        found: any;

        constructor(message: string, expected: any, actual: any);

        name: string;

        toJSON(): AssertionErrorJson;
        toJSON(includeStack?: boolean): AssertionErrorJsonWithStack;
    }

    type AssertionErrorConstructor =
        new (message: string, expected: any, actual: any) => AssertionError;

    var base: Test;
    export default base;

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
        reporters(): Reporter;

        // Define one or more assertion methods on this instance. All the
        // tracking of errors, even in inline tests, are automatically taken
        // care of. `checkInit()` is also called here, so you don't have to.
        //
        // This is also used internally to define the built-in assertions very
        // concisely.
        define(name: string, impl: (...args: any[]) => TestResult): this;
        define(methods: ObjectMap<(...args: any[]) => TestResult>): this;

        // Wrap one or more methods on this instance.
        wrap(name: string, impl: (...args: any[]) => any): this;
        wrap(methods: ObjectMap<(...args: any[]) => any>): this;

        // Add one or more methods on this instance. The first argument and
        // `this` both reference the current instance, and the rest are the
        // other arguments.
        wrap(name: string, impl: (test: this, ...args: any[]) => any): this;
        wrap(methods: ObjectMap<(test: this, ...args: any[]) => any>): this;

        // Get the parent test.
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
    }
}

declare module "techtonic/assertions" {
    import {Test} from "techtonic/core";

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
        // basic assertion
        assert(cond: boolean, message?: string): this;

        // unconditionally fail with an optional message
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

        undefined(object: any): this;
        notUndefined(object: any): this;

        true(object: any): this;
        notTrue(object: any): this;

        false(object: any): this;
        notFalse(object: any): this;

        null(object: any): this;
        notNull(object: any): this;

        undefined(object: any): this;
        notUndefined(object: any): this;

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

        deepEqual<T>(a: T, b: T): this;
        notDeepEqual<T>(a: T, b: T): this;

        looseDeepEqual<T>(a: T, b: T): this;
        notLooseDeepEqual<T>(a: T, b: T): this;

        // TODO: enable the symbol variants once TypeScript supports these
        hasOwn(object: {[key: string]: any}, key: string, value?: any): this;
        hasOwn(object: {[key: number]: any}, key: number, value?: any): this;
        // hasOwn(object: {[key: symbol]: any}, key: symbol, value?: any): this;

        notHasOwn(object: {[key: string]: any}, key: string, value?: any): this;
        notHasOwn(object: {[key: number]: any}, key: number, value?: any): this;
        // notHasOwn(object: {[key: symbol]: any}, key: symbol, value?: any): this;

        looseHasOwn(object: {[key: string]: any}, key: string, value?: any): this;
        looseHasOwn(object: {[key: number]: any}, key: number, value?: any): this;
        // looseHasOwn(object: {[key: symbol]: any}, key: symbol, value?: any): this;

        notLooseHasOwn(object: {[key: string]: any}, key: string, value?: any): this;
        notLooseHasOwn(object: {[key: number]: any}, key: number, value?: any): this;
        // notLooseHasOwn(object: {[key: symbol]: any}, key: symbol, value?: any): this;

        hasKey(object: {[key: string]: any}, key: string, value?: any): this;
        hasKey(object: {[key: number]: any}, key: number, value?: any): this;
        // hasKey(object: {[key: symbol]: any}, key: symbol, value?: any): this;

        notHasKey(object: {[key: string]: any}, key: string, value?: any): this;
        notHasKey(object: {[key: number]: any}, key: number, value?: any): this;
        // notHasKey(object: {[key: symbol]: any}, key: symbol, value?: any): this;

        looseHasKey(object: {[key: string]: any}, key: string, value?: any): this;
        looseHasKey(object: {[key: number]: any}, key: number, value?: any): this;
        // looseHasKey(object: {[key: symbol]: any}, key: symbol, value?: any): this;

        notLooseHasKey(object: {[key: string]: any}, key: string, value?: any): this;
        notLooseHasKey(object: {[key: number]: any}, key: number, value?: any): this;
        // notLooseHasKey(object: {[key: symbol]: any}, key: symbol, value?: any): this;

        throws(func: () => any, Type?: new (...args: any[]) => any): this;
        notThrows(func: () => any, Type?: new (...args: any[]) => any): this;

        throwsMatch(func: () => any, matcher?: Matcher): this;
        notThrowsMatch(func: () => any, matcher?: Matcher): this;

        length(object: {length: number}, length: number): this;
        notLength(object: {length: number}, length: number): this;

        // Note: these always fail with NaNs.
        lengthAtLeast(object: {length: number}, length: number): this;
        lengthAtMost(object: {length: number}, length: number): this;
        lengthAbove(object: {length: number}, length: number): this;
        lengthBelow(object: {length: number}, length: number): this;

        // Note: these two always fail with NaNs.
        closeTo(actual: number, expected: number, delta: number): this;
        notCloseTo(actual: number, expected: number, delta: number): this;

        includes<T>(array: T[], keys: T | T[]): this;
        notIncludesAll<T>(array: T[], keys: T | T[]): this;
        includesAny<T>(array: T[], keys: T | T[]): this;
        notIncludes<T>(array: T[], keys: T | T[]): this;

        includesLoose<T>(array: T[], keys: T | T[]): this;
        notIncludesLooseAll<T>(array: T[], keys: T | T[]): this;
        includesLooseAny<T>(array: T[], keys: T | T[]): this;
        notIncludesLoose<T>(array: T[], keys: T | T[]): this;

        includesDeep<T>(array: T[], keys: T): this;
        notIncludesDeepAll<T>(array: T[], keys: T): this;
        includesDeepAny<T>(array: T[], keys: T): this;
        notIncludesDeep<T>(array: T[], keys: T): this;

        includesLooseDeep<T>(array: T[], keys: T): this;
        notIncludesLooseDeepAll<T>(array: T[], keys: T): this;
        includesLooseDeepAny<T>(array: T[], keys: T): this;
        notIncludesLooseDeep<T>(array: T[], keys: T): this;

        hasKeys(object: any, keys: any): this;
        notHasAllKeys(object: any, keys: any): this;
        hasAnyKeys(object: any, keys: any): this;
        notHasKeys(object: any, keys: any): this;

        hasLooseKeys(object: any, keys: any): this;
        notHasLooseAllKeys(object: any, keys: any): this;
        hasLooseAnyKeys(object: any, keys: any): this;
        notHasLooseKeys(object: any, keys: any): this;

        hasDeepKeys(object: any, keys: any): this;
        notHasDeepAllKeys(object: any, keys: any): this;
        hasDeepAnyKeys(object: any, keys: any): this;
        notHasDeepKeys(object: any, keys: any): this;

        hasLooseDeepKeys(object: any, keys: any): this;
        notHasLooseDeepAllKeys(object: any, keys: any): this;
        hasLooseDeepAnyKeys(object: any, keys: any): this;
        notHasLooseDeepKeys(object: any, keys: any): this;
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
        AssertionErrorJsonWithStack,
        ParentData,
        StartReport,
        EndReport,
        PassReport,
        FailReport,
        PendingReport,
        ExitReport,
        ExtraReportEntry,
        ExtraReportValue,
        ExtraReport,
        Reporter,
        TestResult,
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
