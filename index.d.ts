/* tslint:disable */

import * as Core from "./core";

export {
    AssertionError,
    TestLocation,
    TestReport,
    ExtraReportData,
    StartReport,
    EndReport,
    PassReport,
    FailReport,
    PendingReport,
    ExitReport,
    ExtraReport,
    Reporter,
    AssertionResult,
} from "./core";

import {Assertions} from "./assertions";

export interface Test extends Core.Test, Assertions {}

declare const t: Test;
export default t;
