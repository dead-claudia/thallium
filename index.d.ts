export interface Thenable<T> {
    then<U>(
        resolve: (value: T) => U | Thenable<U>,
        reject?: (value: Error) => U | Thenable<U>
    ): Thenable<U>;
}

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
    "hook";

export type Report =
    StartReport |
    EnterReport |
    LeaveReport |
    PassReport |
    FailReport |
    SkipReport |
    EndReport |
    ErrorReport |
    HookReport;

interface ReportBase<T extends ReportType> {
    type: T;

    isStart: this is StartReport;
    isEnter: this is EnterReport;
    isLeave: this is LeaveReport;
    isPass: this is PassReport;
    isFail: this is FailReport;
    isSkip: this is SkipReport;
    isEnd: this is EndReport;
    isError: this is ErrorReport;
    isHook: this is HookReport;
    inspect(): Object;
}

export interface StartReport extends ReportBase<"start"> {}

export interface EnterReport extends ReportBase<"enter"> {
    path: Location[];
    duration: number;
    slow: number;
}

export interface LeaveReport extends ReportBase<"leave"> {
    path: Location[];
}

export interface PassReport extends ReportBase<"pass"> {
    path: Location[];
    duration: number;
    slow: number;
}

export interface FailReport extends ReportBase<"fail"> {
    path: Location[];
    error: any;
    duration: number;
    slow: number;
}

export interface SkipReport extends ReportBase<"skip"> {
    path: Location[];
}

export interface EndReport extends ReportBase<"end"> {}

export interface ErrorReport extends ReportBase<"error"> {
    error: any;
}

export type HookStage =
    "before all" |
    "before each" |
    "after each" |
    "after all";

export interface HookError<S extends HookStage> {
    stage: S;
    name: string;
    error: any;
}

export interface HookReport<S extends HookStage> extends ReportBase<"hook"> {
    stage: S;
    path: Location[];
    name: string;
    error: any;

    hookError: HookError<S>;
    isBeforeAll: this is HookReport<"before all">;
    isBeforeEach: this is HookReport<"before each">;
    isAfterEach: this is HookReport<"after each">;
    isAfterAll: this is HookReport<"after all">;
}

export type Reporter<T> = ArgReporter<T> | VoidReporter;

export interface ArgReporter<T> {
    (arg: T): (report: Report) => any | Thenable<any>;
}

export interface VoidReporter {
    (): (report: Report) => any | Thenable<any>;
}

export type Plugin<T, R> = ArgPlugin<T, R> | VoidPlugin<R>;

export interface ArgPlugin<T, R> {
    (reflect: Reflect, arg: T): R;
}

export interface VoidPlugin<R> {
    (reflect: Reflect): R;
}

export interface Callback {
    (): any | Thenable<any>;
}

/**
 * Contains several internal methods that are not as useful for most users,
 * but give plenty of access to details for plugin/reporter/etc. developers,
 * in case they need it.
 */
export type Reflect = ReflectRoot | ReflectCommon;

interface ReflectCommon {
    /**
     * Get the currently executing test.
     */
    current: Reflect;

    /**
     * Get the root test.
     */
    root: ReflectRoot;

    /**
     * Get the current total test count.
     */
    count: number;

    /**
     * Get a copy of the current test list, as a Reflect collection. This is
     * intentionally a slice, so you can't mutate the real children.
     */
    children: ReflectChild[];

    /**
     * Is this test the root, i.e. top level?
     */
    isRoot: this is ReflectRoot;

    /**
     * Is this locked (i.e. unsafe to modify)?
     */
    isLocked: boolean;

    /**
     * Get the own, not necessarily active, timeout. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    ownTimeout: number;

    /**
     * Get the active timeout in milliseconds, not necessarily own, or the
     * framework default of 2000, if none was set.
     */
    timeout: number;

    /**
     * Get the own, not necessarily active, slow threshold. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    ownSlow: number;

    /**
     * Get the active slow threshold in milliseconds, not necessarily own, or
     * the framework default of 75, if none was set.
     */
    slow: number;

    /**
     * Add a hook to be run before each subtest, including their subtests and so
     * on.
     */
    before(func: Callback): void;

    /**
     * Add a hook to be run once before all subtests are run.
     */
    beforeAll(func: Callback): void;

    /**
     * Add a hook to be run after each subtest, including their subtests and so
     * on.
     */
    after(func: Callback): void;

    /**
     * Add a hook to be run once after all subtests are run.
     */
    afterAll(func: Callback): void;

    /**
     * Whether a hook was previously added with `t.before` or `reflect.before`.
     */
    hasBefore(func: Callback): boolean;

    /**
     * Whether a hook was previously added with `t.beforeAll` or
     * `reflect.beforeAll`.
     */
    hasBeforeAll(func: Callback): boolean;

    /**
     * Whether a hook was previously added with `t.after` or`reflect.after`.
     */
    hasAfter(func: Callback): boolean;

    /**
     * Whether a hook was previously added with `t.afterAll` or
     * `reflect.afterAll`.
     */
    hasAfterAll(func: Callback): boolean;

    /**
     * Remove a hook previously added with `t.before` or `reflect.before`.
     */
    removeBefore(func: Callback): void;

    /**
     * Remove a hook previously added with `t.beforeAll` or `reflect.beforeAll`.
     */
    removeBeforeAll(func: Callback): void;

    /**
     * Remove a hook previously added with `t.after` or`reflect.after`.
     */
    removeAfter(func: Callback): void;

    /**
     * Remove a hook previously added with `t.afterAll` or `reflect.afterAll`.
     */
    removeAfterAll(func: Callback): void;

    /**
     * Add a block or inline test.
     */
    test(name: string, callback: Callback): void;

    /**
     * Add a skipped block or inline test.
     */
    testSkip(name: string, callback: Callback): void;
}

export interface ReflectRoot extends ReflectCommon {
    /**
     * Whether a particulare reporter was registered
     */
    hasReporter(reporter: Reporter<any>): boolean;

    /**
     * Add a reporter.
     */
    reporter<T>(reporter: Reporter<T>, arg: T): void;

    /**
     * Add a reporter.
     */
    reporter(reporter: VoidReporter): void;

    /**
     * Remove a reporter.
     */
    removeReporter(reporter: Reporter<any>): void;
}

export interface ReflectChild extends ReflectCommon {
    /**
     * Get the test name.
     */
    name: String;

    /**
     * Get the test index.
     */
    index: number;

    /**
     * Get the parent test as a Reflect.
     */
    parent: Reflect;
}

export interface Test {
    /**
     * Friendly alias for ES6 module transpilers.
     */
    default: this;

    /**
     * Call a plugin and return the result. The plugin is called with a Reflect
     * instance for access to plenty of potentially useful internal details.
     */
    call<T, R>(plugin: Plugin<T, R>, arg: T): R;
    call<R>(plugin: VoidPlugin<R>): R;

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     */
    only(...selectors: Array<string | RegExp>[]): void;

    /**
     * Add a reporter. Throws an error if this isn't in the root test.
     */
    reporter<T>(reporter: Reporter<T>, arg: T): void;

    /**
     * Add a reporter. Throws an error if this isn't in the root test.
     */
    reporter(reporter: VoidReporter): void;

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
     * Run the tests (or the test's tests if it's not a base instance).
     */
    run(): Promise<void>;

    /**
     * Add a test.
     */
    test(name: string, body: Callback): this;

    /**
     * Add a skipped test.
     */
    testSkip(name: string, body: Callback): this;

    /**
     * Add a hook to be run before each subtest, including their subtests and so
     * on.
     */
    before(func: Callback): void;

    /**
     * Add a hook to be run once before all subtests are run.
     */
    beforeAll(func: Callback): void;

    /**
     * Add a hook to be run after each subtest, including their subtests and so
     * on.
     */
    after(func: Callback): void;

    /**
     * Add a hook to be run once after all subtests are run.
     */
    afterAll(func: Callback): void;
}

declare const t: Test;
export default t;
