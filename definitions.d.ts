/* tslint:disable */

declare module "techtonic/core" {
    interface NestedReporterArray extends Array<NestedReporter> {}
    type NestedReporter = Reporter | NestedReporterArray;

    type Callback = (err?: Error) => any;

    export interface ParentData {
        name: string;
        index: number;
        parent: ParentData | void;
    }

    export interface FailReport {
        type: "fail";
        value: any;
        name: string;
        index: number;
        parent: ParentData;
    }

    export interface PassReport {
        type: "pass";
        value: void;
        name: string;
        index: number;
        parent: ParentData;
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

    type TestReport = FailReport | PassReport | ExtraReport;

    export interface Reporter {
        (item: TestReport, done: (err?: Error) => void): any;
    }

    export interface TestResult {
        [key: string]: any;
        actual: any;
        expected: any;
        message: string;
    }

    export interface AsyncDone {
        (err?: Error): void;
    }

    export interface Plugin {
        (t: Test): any;
    }

    export interface AssertionErrorJsonResult<T, U> {
        name: string;
        message: string;
        expected: T;
        actual: U;
        stack?: string;
    }

    export class AssertionError<T, U> extends Error {
        message: string;
        expected: T;
        found: U;

        constructor(message: string, expected: T, actual: U);

        name: string;

        toJSON(includeStack?: boolean): AssertionErrorJsonResult<T, U>;
    }

    type AssertionErrorConstructor =
        new <T, U>(message: string, expected: T, actual: U) =>
            AssertionError<T, U>;

    var base: Test;
    export default base;

    type IteratorResult = {
        done: boolean;
        value: any;
    }

    type Iterator = {
        next(value?: any): IteratorResult;
        return?(value?: any): IteratorResult;
        throw?(e?: any): IteratorResult;
    }

    type Thenable = {
        then(
            onresolve: (value: any) => void,
            onreject: (value: any) => void
        ): any;
    }

    export interface Test {
        AssertionError: AssertionErrorConstructor;

        // Use a plugin
        use(plugin: Plugin): this;

        // Define an assertion method on this instance
        define(name: string, impl: (...args: any[]) => TestResult): this;

        // Define many assertion methods on this instance
        define(methods: {[name: string]: (...args: any[]) => TestResult}): this;

        // Define an async test. This may return a promise, a generator, or call
        // `done` with a possible error.
        async(name: string, run: (test: this, done: AsyncDone) => any): this;
        async(name: string, run: (test: this) => Thenable): this;
        async(name: string, run: (test: this) => Iterator): this;

        // New sync test, assertion shorthand
        test(name: string): this;

        // New sync test, returns the current instance
        test(name: string, run: (test: this) => any): this;
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

        equal<T>(a: T, b: T): this;
        notEqual<T>(a: T, b: T): this;

        looseEqual<T>(a: T, b: T): this;
        notLooseEqual<T>(a: T, b: T): this;

        deepEqual<T>(a: T, b: T): this;
        notDeepEqual<T>(a: T, b: T): this;

        looseDeepEqual<T>(a: T, b: T): this;
        notLooseDeepEqual<T>(a: T, b: T): this;

        type(object: any, type: TypeofValue): this;
        notType(object: any, type: TypeofValue): this;

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

        instanceof(object: any, Type: new (...args: any[]) => any): this;
        notInstanceof(object: any, Type: new (...args: any[]) => any): this;

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

        notHaveKey(object: {[key: string]: any}, key: string, value?: any): this;
        notHaveKey(object: {[key: number]: any}, key: number, value?: any): this;
        // notHaveKey(object: {[key: symbol]: any}, key: symbol, value?: any): this;

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
        ParentData,
        FailReport,
        PassReport,
        ExtraReportEntry,
        ExtraReportValue,
        ExtraReport,
        Reporter,
        TestResult,
        AsyncDone,
        Plugin,
        AssertionErrorJsonResult,
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
