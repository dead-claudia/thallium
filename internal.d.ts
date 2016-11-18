import {
    Test, Location,
    StartReport, EnterReport, LeaveReport, PassReport,
    FailReport, SkipReport, EndReport, ErrorReport, HookReport,
    HookStage, HookError,
} from "./index";

/**
 * Create a new Thallium instance.
 */
export function root(): Test;

export namespace reports {
    /**
     * Create a `start` report. Mostly useful for testing reporters.
     */
    export function start(): StartReport;

    /**
     * Create a `enter` report. Mostly useful for testing reporters.
     */
    export function enter(path: Location[], duration?: number, slow?: number): EnterReport;

    /**
     * Create a `leave` report. Mostly useful for testing reporters.
     */
    export function leave(path: Location[]): LeaveReport;

    /**
     * Create a `pass` report. Mostly useful for testing reporters.
     */
    export function pass(path: Location[], duration?: number, slow?: number): PassReport;

    /**
     * Create a `fail` report. Mostly useful for testing reporters.
     */
    export function fail(path: Location[], error: any, duration?: number, slow?: number): FailReport;

    /**
     * Create a `skip` report. Mostly useful for testing reporters.
     */
    export function skip(path: Location[]): SkipReport;

    /**
     * Create a `end` report. Mostly useful for testing reporters.
     */
    export function end(): EndReport;

    /**
     * Create a `error` report. Mostly useful for testing reporters.
     */
    export function error(error: any): EndReport;

    /**
     * Create a `hook` report. Mostly useful for testing reporters.
     */
    export function hook<S extends HookStage>(
        path: Location[],
        hookError: HookError<S>
    ): HookReport<S>;
}

export namespace hookErrors {
    /**
     * Create a new `before all` hook error, mainly for testing reporters.
     */
    export function beforeAll(func: Function, error: any): HookError<"before all">;

    /**
     * Create a new `before each` hook error, mainly for testing reporters.
     */
    export function beforeEach(func: Function, error: any): HookError<"before each">;

    /**
     * Create a new `after each` hook error, mainly for testing reporters.
     */
    export function afterEach(func: Function, error: any): HookError<"after each">;

    /**
     * Create a new `after all` hook error, mainly for testing reporters.
     */
    export function afterAll(func: Function, error: any): HookError<"after all">;
}

/**
 * Create a location data object. Mostly useful for testing reporters.
 */
export function location(name: string, index: number): Location;
