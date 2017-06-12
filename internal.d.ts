import {
    Test, Location,
    StartReport, EnterReport, LeaveReport, PassReport,
    FailReport, SkipReport, EndReport, ErrorReport,
    BeforeAllReport, BeforeEachReport, AfterEachReport, AfterAllReport,
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

    export namespace hook {
        /**
         * Create a `hook` report. Mostly useful for testing reporters.
         */
        export function beforeAll(path: Location[], rootPath: Location[], func: (...args: any[]) => any, error: any): BeforeAllReport;

        /**
         * Create a `hook` report. Mostly useful for testing reporters.
         */
        export function beforeEach(path: Location[], rootPath: Location[], func: (...args: any[]) => any, error: any): BeforeEachReport;

        /**
         * Create a `hook` report. Mostly useful for testing reporters.
         */
        export function afterEach(path: Location[], rootPath: Location[], func: (...args: any[]) => any, error: any): AfterEachReport;

        /**
         * Create a `hook` report. Mostly useful for testing reporters.
         */
        export function afterAll(path: Location[], rootPath: Location[], func: (...args: any[]) => any, error: any): AfterAllReport;
    }
}

/**
 * Create a location data object. Mostly useful for testing reporters.
 */
export function location(name: string, index: number): Location;
