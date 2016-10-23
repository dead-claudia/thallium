import {
    Test, Location,
    StartReport, EnterReport, LeaveReport, PassReport,
    FailReport, SkipReport, EndReport, ErrorReport, HookReport,
    HookStage, HookError,
} from "./index";

/**
 * Create a new Thallium instance.
 */
export function createRoot(): Test;

export namespace reports {
    /**
     * Create a `start` report. Mostly useful for testing reporters.
     */
    export function start(): StartReport;

    /**
     * Create a `enter` report. Mostly useful for testing reporters. Note that the
     * `ignored` argument is ignored.
     */
    export function enter(path: Location[], duration?: number, slow?: number): EnterReport;

    /**
     * Create a `leave` report. Mostly useful for testing reporters.
     */
    export function leave(path: Location[]): LeaveReport;

    /**
     * Create a `pass` report. Mostly useful for testing reporters. Note that the
     * `ignored` argument is ignored.
     */
    export function pass(path: Location[], duration?: number, slow?: number): PassReport;

    /**
     * Create a `fail` report. Mostly useful for testing reporters.
     */
    export function fail(path: Location[], value: any, duration?: number, slow?: number): FailReport;

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
    export function error(value: any): EndReport;

    /**
     * Create a `hook` report. Mostly useful for testing reporters.
     */
    export function hook<S extends HookStage>(
        path: Location[],
        value: HookError<S>
    ): HookReport<S>;
}

/**
 * Creates a new hook error, mainly for testing reporters.
 */
export namespace hookError {
    export function beforeAll(func: Function, value: any): HookError<"before all">;
    export function beforeEach(func: Function, value: any): HookError<"before each">;
    export function afterEach(func: Function, value: any): HookError<"after each">;
    export function afterAll(func: Function, value: any): HookError<"after all">;
}

/**
 * Create a location data object. Mostly useful for testing reporters.
 */
export function createLocation(name: string, index: number): Location;
