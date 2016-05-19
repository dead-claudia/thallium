/* tslint:disable */

export interface NestedArray<T> extends Array<T> {}
export type Nested<T> = T | NestedArray<T>;

export interface Callback<T> {
    (err?: Error): T;
}

export type TestType =
    "start" | "end" | "pass" | "fail" | "skip" | "exit" | "extra";

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
export interface PendingReport extends TestReport<"skip", void> {}
export interface ExitReport extends TestReport<"exit", void> {}
export interface ExtraReport extends TestReport<"extra", ExtraReportData> {}

export interface Plugin<T extends Test> {
    (t: T): any;
}

export interface Reporter {
    (item: TestReport<TestType, any>, done: Callback<void>): any;

    // Whether this needs to block everything else. Useful if you need to
    // have sole async access to a resource, and there's no lock available.
    block?: boolean;
}

export interface DefineImpl {
    (...args: any[]): AssertionResult;
}

export interface WrapImpl {
    (f: (...args: any[]) => any, ...args: any[]): any;
}

export interface AddImpl<T extends Test> {
    (test: T, ...args: any[]): any;
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

export class AssertionError extends Error {
    name: "AssertionError";
    message: string;
    expected: any;
    found: any;

    constructor(message: string, expected: any, actual: any);
}

export interface IteratorResult<T> {
    done: boolean;
    value: T;
}

export interface Iterator<T> {
    next(value?: any): IteratorResult<T>;
    throw?(err?: any): IteratorResult<T>;
}

export interface ObjectMap<T> {
    [name: string]: T;
}

export interface Test {
    AssertionError: typeof AssertionError;

    // Exposed for testing, but might be interesting for consumers.
    base(): Test;

    // Only run tests that match these selectors.
    only(...selectors: string[][]): this;

    // Use one or more plugins.
    use(...plugins: Nested<Plugin<this>>[]): this;

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
    define(name: string, impl: DefineImpl): this;
    define(methods: ObjectMap<DefineImpl>): this;

    // Wrap one or more methods on this instance.
    wrap(name: string, impl: WrapImpl): this;
    wrap(methods: ObjectMap<WrapImpl>): this;

    // Add one or more methods on this instance. The first argument and
    // `this` both reference the current instance, and the rest are the
    // other arguments.
    add(name: string, impl: AddImpl<this>): this;
    add(methods: ObjectMap<AddImpl<this>>): this;

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
    run(callback: Callback<any>): void;

    // New shorthand sync test, use testSkip to skip it.
    test(name: string): this;
    testSkip(name: string): this;

    // New sync test, returns the current instance, use testSkip to skip it.
    test(name: string, run: (test: this) => any): this;
    testSkip(name: string, run: (test: this) => any): this;

    // Define an async test. This may return a promise, a generator, or call
    // `done` with a possible error. Use asyncSkip to skip it.
    async(name: string, run: (test: this, done: Callback<void>) => any): this;
    async(name: string, run: (test: this) => PromiseLike<any>): this;
    async(name: string, run: (test: this) => Iterator<any>): this;

    asyncSkip(name: string, run: (test: this, done: Callback<void>) => any): this;
    asyncSkip(name: string, run: (test: this) => PromiseLike<any>): this;
    asyncSkip(name: string, run: (test: this) => Iterator<any>): this;

    // Run a block when assertions are run. This exists primarily for
    // inline tests, in case they have specific setup to do.
    do(func: () => any): this;
}

declare const t: Test;
export default t;
