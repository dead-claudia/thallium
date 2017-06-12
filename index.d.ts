/* tslint:disable */

import {DotOptions, SpecOptions, TapOptions} from "./r";

export interface Location {
    name: string;
    index: number;
}

export type ReportType =
    "start" |
    "enter" |
    "leave" |
    "pass" |
    "fail" |
    "skip" |
    "end" |
    "error" |
    "before all" |
    "before each" |
    "after each" |
    "after all";

export type Report =
    StartReport |
    EnterReport |
    LeaveReport |
    PassReport |
    FailReport |
    SkipReport |
    EndReport |
    ErrorReport |
    BeforeAllReport |
    BeforeEachReport |
    AfterEachReport |
    AfterAllReport;

interface ReportBase<T extends ReportType> {
    type: T;
    inspect(): any;
}

export interface StartReport extends ReportBase<"start"> {
    isStart: true;
    isEnter: false;
    isLeave: false;
    isPass: false;
    isFail: false;
    isSkip: false;
    isEnd: false;
    isError: false;
    isHook: false;
}

export interface EnterReport extends ReportBase<"enter"> {
    path: Location[];
    duration: number;
    slow: number;

    isStart: false;
    isEnter: true;
    isLeave: false;
    isPass: false;
    isFail: false;
    isSkip: false;
    isEnd: false;
    isError: false;
    isHook: false;
}

export interface LeaveReport extends ReportBase<"leave"> {
    path: Location[];

    isStart: false;
    isEnter: false;
    isLeave: true;
    isPass: false;
    isFail: false;
    isSkip: false;
    isEnd: false;
    isError: false;
    isHook: false;
}

export interface PassReport extends ReportBase<"pass"> {
    path: Location[];
    duration: number;
    slow: number;

    isStart: false;
    isEnter: false;
    isLeave: false;
    isPass: true;
    isFail: false;
    isSkip: false;
    isEnd: false;
    isError: false;
    isHook: false;
}

export interface FailReport extends ReportBase<"fail"> {
    path: Location[];
    error: any;
    duration: number;
    slow: number;

    isStart: false;
    isEnter: false;
    isLeave: false;
    isPass: false;
    isFail: true;
    isSkip: false;
    isEnd: false;
    isError: false;
    isHook: false;
}

export interface SkipReport extends ReportBase<"skip"> {
    path: Location[];

    isStart: false;
    isEnter: false;
    isLeave: false;
    isPass: false;
    isFail: false;
    isSkip: true;
    isEnd: false;
    isError: false;
    isHook: false;
}

export interface EndReport extends ReportBase<"end"> {
    isStart: false;
    isEnter: false;
    isLeave: false;
    isPass: false;
    isFail: false;
    isSkip: false;
    isEnd: true;
    isError: false;
    isHook: false;
}

export interface ErrorReport extends ReportBase<"error"> {
    error: any;

    isStart: false;
    isEnter: false;
    isLeave: false;
    isPass: false;
    isFail: false;
    isSkip: false;
    isEnd: false;
    isError: true;
    isHook: false;
}

interface HookReportBase<S extends ReportType> extends ReportBase<S> {
    stage: S;
    path: Location[];
    rootPath: Location[];
    name: string;
    error: any;

    isStart: false;
    isEnter: false;
    isLeave: false;
    isPass: false;
    isFail: false;
    isSkip: false;
    isEnd: false;
    isError: false;
    isHook: true;
}

export interface BeforeAllReport extends HookReportBase<"before all"> {
    isBeforeAll: true;
    isBeforeEach: false;
    isAfterEach: false;
    isAfterAll: false;
}

export interface BeforeEachReport extends HookReportBase<"before each"> {
    isBeforeAll: false;
    isBeforeEach: true;
    isAfterEach: false;
    isAfterAll: false;
}

export interface AfterEachReport extends HookReportBase<"after each"> {
    isBeforeAll: false;
    isBeforeEach: false;
    isAfterEach: true;
    isAfterAll: false;
}

export interface AfterAllReport extends HookReportBase<"after all"> {
    isBeforeAll: false;
    isBeforeEach: false;
    isAfterEach: false;
    isAfterAll: true;
}

export type Reporter = (report: Report) => any | PromiseLike<any>;

/**
 * Contains several internal methods that are not as useful for most users,
 * but give plenty of access to details for plugin/reporter/etc. developers,
 * in case they need it.
 */
export interface Reflect {
    /**
     * Is this test the root, i.e. top level?
     */
    isRoot: boolean;

    /**
     * Whether a particular reporter was registered.
     *
     * @throws TypeError if this isn't in the root
     */
    hasReporter(reporter: Reporter): boolean;

    /**
     * Add a reporter.
     *
     * @throws TypeError if this isn't in the root.
     */
    addReporter<T extends Reporter>(reporter: T): T;

    /**
     * Remove a reporter.
     *
     * @throws TypeError if this isn't in the root.
     */
    removeReporter(reporter: Reporter): void;

    /**
     * Get the test name or `undefined` if this is the root.
     */
    name: string | undefined;

    /**
     * Get the test index or `undefined` if this is the root.
     */
    index: number | undefined;

    /**
     * Get the parent test as a Reflect or `undefined` if this is the root.
     */
    parent: Reflect | undefined;

    /**
     * Get the currently executing test.
     */
    current: Reflect;

    /**
     * Get the root test.
     */
    root: Reflect;

    /**
     * Get the current total test count.
     */
    count: number;

    /**
     * Get a copy of the current test list, as a Reflect collection. This is
     * intentionally a slice, so you can't mutate the real children.
     */
    children: Reflect[];

    /**
     * Is this locked (i.e. unsafe to modify)?
     */
    isLocked: boolean;

    /**
     * Get the active timeout in milliseconds, not necessarily own, or the
     * framework default of 2000, if none was set.
     */
    timeout: number;

    /**
     * Get the active slow threshold in milliseconds, not necessarily own, or
     * the framework default of 75, if none was set.
     */
    slow: number;

    /**
     * Add a hook to be run before each subtest, including their subtests and so
     * on.
     */
    before(func: () => any | PromiseLike<any>): void;

    /**
     * Add a hook to be run once before all subtests are run.
     */
    beforeAll(func: () => any | PromiseLike<any>): void;

    /**
     * Add a hook to be run after each subtest, including their subtests and so
     * on.
     */
    after(func: () => any | PromiseLike<any>): void;

    /**
     * Add a hook to be run once after all subtests are run.
     */
    afterAll(func: () => any | PromiseLike<any>): void;

    /**
     * Whether a hook was previously added with `t.before` or `reflect.before`.
     */
    hasBefore(func: () => any | PromiseLike<any>): boolean;

    /**
     * Whether a hook was previously added with `t.beforeAll` or
     * `reflect.beforeAll`.
     */
    hasBeforeAll(func: () => any | PromiseLike<any>): boolean;

    /**
     * Whether a hook was previously added with `t.after` or`reflect.after`.
     */
    hasAfter(func: () => any | PromiseLike<any>): boolean;

    /**
     * Whether a hook was previously added with `t.afterAll` or
     * `reflect.afterAll`.
     */
    hasAfterAll(func: () => any | PromiseLike<any>): boolean;

    /**
     * Remove a hook previously added with `t.before` or `reflect.before`.
     */
    removeBefore(func: () => any | PromiseLike<any>): void;

    /**
     * Remove a hook previously added with `t.beforeAll` or `reflect.beforeAll`.
     */
    removeBeforeAll(func: () => any | PromiseLike<any>): void;

    /**
     * Remove a hook previously added with `t.after` or`reflect.after`.
     */
    removeAfter(func: () => any | PromiseLike<any>): void;

    /**
     * Remove a hook previously added with `t.afterAll` or `reflect.afterAll`.
     */
    removeAfterAll(func: () => any | PromiseLike<any>): void;

    /**
     * Add a block or inline test.
     */
    test(name: string, callback: () => any | PromiseLike<any>): void;

    /**
     * Skip this test.
     */
    skip(): never;
}

export interface RunOptions {
    only: Array<string | RegExp>[];
    skip: Array<string | RegExp>[];
}

export interface RunResult {
    isSuccess: boolean;
}

export interface Test {
    /**
     * Get a raw reflect instance.
     */
    reflect: Reflect;

    /**
     * Call a plugin and return the result. The plugin is called with a Reflect
     * instance for access to plenty of potentially useful internal details.
     */
    call<R>(plugin: (reflect: Reflect) => R): R;

    /**
     * NOTE: This is a write-only property.
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     */
    only: Array<string | RegExp>[];

    /**
     * NOTE: This is a write-only property.
     * Add a reporter.
     *
     * @throws TypeError if this isn't in the root
     */
    reporter: (
        // This *must* be kept up to date with the available reporters in
        // `thallium/r`.
        | ["dot"] | ["dot", DotOptions]
        | ["spec"] | ["spec", SpecOptions]
        | ["tap"] | ["tap", TapOptions]
        | Reporter
    );

    /**
     * Get the current timeout. 0 means inherit the parent's, and `Infinity`
     * means it's disabled.
     *
     * Set the timeout in milliseconds, rounding negatives to 0. Setting the
     * timeout to 0 means to inherit the parent timeout, and setting it to
     * `Infinity` disables it.
     */
    timeout: number;

    /**
     * Get the current slow threshold. 0 means inherit the parent's, and
     * `Infinity` means it's disabled.
     *
     * Set the slow threshold in milliseconds, rounding negatives to 0. Setting
     * the timeout to 0 means to inherit the parent threshold, and setting it to
     * `Infinity` disables it.
     */
    slow: number;

    /**
     * NOTE: This is a write-only property.
     * Set various default options.
     *
     * @throws TypeError if this isn't in the root
     */
    options: RunOptions;

    /**
     * Run the tests.
     *
     * @throws TypeError if this isn't in the root
     */
    run(opts?: RunOptions): Promise<RunResult>;

    /**
     * Add a test.
     */
    test(name: string, body: () => any | PromiseLike<any>): this;

    /**
     * Skip this test.
     */
    skip(): never;

    /**
     * Add a hook to be run before each subtest, including their subtests and so
     * on.
     */
    before(func: () => any | PromiseLike<any>): void;

    /**
     * Add a hook to be run once before all subtests are run.
     */
    beforeAll(func: () => any | PromiseLike<any>): void;

    /**
     * Add a hook to be run after each subtest, including their subtests and so
     * on.
     */
    after(func: () => any | PromiseLike<any>): void;

    /**
     * Add a hook to be run once after all subtests are run.
     */
    afterAll(func: () => any | PromiseLike<any>): void;
}

declare const t: Test;
export default t;
