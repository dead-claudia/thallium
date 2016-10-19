import {
    Test, Location,
    StartReport, EnterReport, LeaveReport, PassReport,
    FailReport, SkipReport, EndReport, ErrorReport, HookReport,
    HookInfo,
} from "./index";

/**
 * Create a new Thallium instance.
 */
export function createBase(): Test;

/**
 * Create a `start` report. Mostly useful for testing reporters.
 */
export function createReport(type: "start", path: Location[]): StartReport;

/**
 * Create a `enter` report. Mostly useful for testing reporters. Note that the
 * `ignored` argument is ignored.
 */
export function createReport(type: "enter", path: Location[], ignored?: void, duration?: number, slow?: number): EnterReport;

/**
 * Create a `leave` report. Mostly useful for testing reporters.
 */
export function createReport(type: "leave", path: Location[]): LeaveReport;

/**
 * Create a `pass` report. Mostly useful for testing reporters. Note that the
 * `ignored` argument is ignored.
 */
export function createReport(type: "pass", path: Location[], ignored?: void, duration?: number, slow?: number): PassReport;

/**
 * Create a `fail` report. Mostly useful for testing reporters.
 */
export function createReport(type: "fail", path: Location[], value: any, duration?: number, slow?: number): FailReport;

/**
 * Create a `skip` report. Mostly useful for testing reporters.
 */
export function createReport(type: "skip", path: Location[]): SkipReport;

/**
 * Create a `end` report. Mostly useful for testing reporters.
 */
export function createReport(type: "end", path: Location[]): EndReport;

/**
 * Create a `error` report. Mostly useful for testing reporters.
 */
export function createReport(type: "error", path: Location[], value: any): EndReport;

/**
 * Create a `hook` report. Mostly useful for testing reporters.
 */
export function createReport(type: "hook", path: Location[], value: HookInfo): HookReport;

/**
 * Create a location data object. Mostly useful for testing reporters.
 */
export function createLocation(name: string, index: number): Location;
