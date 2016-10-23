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

interface TestReport<T extends ReportType, U> {
    type: T;
    path: Location[];
    value: U;
    duration: number;
    slow: number;

    start: this is StartReport;
    enter: this is EnterReport;
    leave: this is LeaveReport;
    pass: this is PassReport;
    fail: this is FailReport;
    skip: this is SkipReport;
    end: this is EndReport;
    error: this is ErrorReport;
    hook: this is HookReport;
}

export interface StartReport extends TestReport<"start", void> {
    inspect(): {
        type: "start";
        path: Location[];
    };
}

export interface EnterReport extends TestReport<"enter", void> {
    inspect(): {
        type: "enter";
        path: Location[];
        duration: number;
        slow: number;
    };
}

export interface LeaveReport extends TestReport<"leave", void> {
    inspect(): {
        type: "leave";
        path: Location[];
    };
}

export interface PassReport extends TestReport<"pass", void> {
    inspect(): {
        type: "pass";
        path: Location[];
        duration: number;
        slow: number;
    };
}

export interface FailReport extends TestReport<"fail", any> {
    inspect(): {
        type: "fail";
        path: Location[];
        value: any;
        duration: number;
        slow: number;
    };
}

export interface SkipReport extends TestReport<"skip", void> {
    inspect(): {
        type: "skip";
        path: Location[];
    };
}

export interface EndReport extends TestReport<"end", void> {
    inspect(): {
        type: "end";
        path: Location[];
    };
}

export interface ErrorReport extends TestReport<"error", void> {
    inspect(): {
        type: "error";
        path: Location[];
        value: any;
    };
}

export type HookInfoStage =
    "before all" |
    "before each" |
    "after each" |
    "after all";

export type HookInfo =
    BeforeAllHook |
    BeforeEachHook |
    AfterEachHook |
    AfterAllHook;

interface HookInfoBase<S extends HookInfoStage> {
    stage: S;
    value: any;
    beforeAll: this is BeforeAllHook;
    beforeEach: this is BeforeEachHook;
    afterEach: this is AfterEachHook;
    afterAll: this is AfterAllHook;

    inspect(): {
        stage: S;
        value: any;
    };
}

export interface BeforeAllHook extends HookInfoBase<"before all"> {}
export interface BeforeEachHook extends HookInfoBase<"before each"> {}
export interface AfterEachHook extends HookInfoBase<"after each"> {}
export interface AfterAllHook extends HookInfoBase<"after all"> {}

export interface HookReport extends TestReport<"hook", HookInfo> {
    inspect(): {
        type: "hook";
        path: Location[];
        value: {
            stage: HookInfoStage;
            value: any;
        };
    };
}

/**
 * Contains several internal methods that are not as useful for most users,
 * but give plenty of access to details for plugin/reporter/etc. developers,
 * in case they need it.
 */
export interface Reflect {
    /**
     * A reference to the test's state, purely for internal use.
     *
     * @internal
     */
    _: Object;

    /**
     * Get the currently executing test.
     */
    current: Reflect;

    /**
     * Get the global root.
     */
    global: Reflect;

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
     * Get the test name, or `undefined` if it's the root test.
     */
    name: String | void;

    /**
     * Get the test index, or `-1` if it's the root test.
     */
    index: number;

    /**
     * Is this test the root, i.e. top level?
     */
    root: boolean;

    /**
     * Is this locked (i.e. unsafe to modify)?
     */
    locked: boolean;

    /**
     * Get a list of all own reporters. If none were added, an empty list is
     * returned.
     */
    reporters: ((report: Report) => any | Thenable<any>)[];

    /**
     * Get a list of all active reporters, either on this instance or on the
     * closest parent.
     */
    activeReporters: ((report: Report) => any | Thenable<any>)[];

    /**
     * Get the own, not necessarily active, timeout. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    timeout: number;

    /**
     * Get the active timeout in milliseconds, not necessarily own, or the
     * framework default of 2000, if none was set.
     */
    activeTimeout: number;

    /**
     * Get the own, not necessarily active, slow threshold. 0 means inherit the
     * parent's, and `Infinity` means it's disabled.
     */
    slow: number;

    /**
     * Get the active slow threshold in milliseconds, not necessarily own, or
     * the framework default of 75, if none was set.
     */
    activeSlow: number;

    /**
     * Get the parent test as a Reflect.
     */
    parent: Reflect | void;

    /**
     * Before/after hooks, for initialization and cleanup.
     */

    /**
     * Add a hook to be run before each subtest, including their subtests and so
     * on.
     */
    addBeforeEach(func: () => any | Thenable<any>): void;

    /**
     * Add a hook to be run once before all subtests are run.
     */
    addBeforeAll(func: () => any | Thenable<any>): void;

   /**
    * Add a hook to be run after each subtest, including their subtests and so
    * on.
    */
    addAfterEach(func: () => any | Thenable<any>): void;

    /**
     * Add a hook to be run once after all subtests are run.
     */
    addAfterAll(func: () => any | Thenable<any>): void;

    /**
     * Remove a hook previously added with `t.before` or
     * `reflect.addBeforeEach`.
     */
    removeBeforeEach(func: () => any | Thenable<any>): void;

    /**
     * Remove a hook previously added with `t.beforeAll` or
     * `reflect.addBeforeAll`.
     */
    removeBeforeAll(func: () => any | Thenable<any>): void;

    /**
     * Remove a hook previously added with `t.after` or`reflect.addAfterEach`.
     */
    removeAfterEach(func: () => any | Thenable<any>): void;

    /**
     * Remove a hook previously added with `t.afterAll` or
     * `reflect.addAfterAll`.
     */
    removeAfterAll(func: () => any | Thenable<any>): void;

    /**
     * Thallium API methods made available on reflect objects, so they don't
     * need a test instance to wrap everything.
     */

    /**
     * Add a reporter.
     */
    addReporter(reporter: (report: Report) => any | Thenable<any>, blocking?: boolean): void;

    /**
     * Remove a reporter.
     */
    removeReporter(reporter: (report: Report) => any | Thenable<any>): void;

    /**
     * Add a block or inline test.
     */
    test(name: string, callback: () => any | Thenable<any>): void;

    /**
     * Add a skipped block or inline test.
     */
    testSkip(name: string, callback: () => any | Thenable<any>): void;
}

export interface Test {
    /**
     * A reference to the test's state, purely for internal use.
     *
     * @internal
     */
    _: Object;

    /**
     * Friendly alias for ES6 module transpilers.
     */
    default: this;

    /**
     * Call a plugin and return the result. The plugin is called with a Reflect
     * instance for access to plenty of potentially useful internal details.
     */
    call<T>(plugin: (reflect: Reflect) => T): T;

    /**
     * Whitelist specific tests, using array-based selectors where each entry
     * is either a string or regular expression.
     */
    only(...selectors: Array<string | RegExp>[]): void;

    /**
     * Add a number of reporters. Note that this does add reporters to skipped
     * tests, because they're still runnable.
     *
     * `block` is `true` if this reporter needs to block while emitting its
     * data, but still work asynchronously. Useful if you need to have sole
     * async access to a resource, but there's no lock available. A good example
     * is having multiple console reporters, in which you probably want to make
     * at least all but one block.
     */
    reporter(reporter: (report: Report) => any | Thenable<any>, block?: boolean): void;

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
    test(name: string, body: () => any | Thenable<any>): this;

    /**
     * Add a skipped test.
     */
    testSkip(name: string, body: () => any | Thenable<any>): this;
}

declare const t: Test;
export default t;
