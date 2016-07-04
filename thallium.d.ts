import {Test as CoreTest} from "./index";
export {CoreTest};

export {
    default as t,
    Callback,

    ReportType,
    Location,
    Report,
    TestReport,
    ExtraCall,
    StartReport,
    EnterReport,
    LeaveReport,
    PassReport,
    FailReport,
    SkipReport,
    EndReport,
    ExtraReport,

    Plugin,
    Reporter,

    DefineImpl,
    WrapImpl,
    AddImpl,

    AssertionResult,
    AssertionError,

    Reflect,
    IteratorResult,
    Iterator,
    ObjectMap,
    AsyncDone,
    AsyncReturn,
    AsyncCallback,
    Test,
} from "./index";

export {
    Key,
    TypeofValue,
    Matcher,
    MapLike,
    Assertions,
    default as assertions,
} from "./assertions";

export function create(): CoreTest;

export namespace r {
    // import dom, * as Dom from "../r/dom";
    import dot, * as Dot from "../r/dot";
    import spec, * as Spec from "../r/spec";
    import tap, * as Tap from "../r/tap";

    // export {Dom, dom};
    export {Dot, dot};
    export {Spec, spec};
    export {Tap, tap};
}

export interface ColorSupportOptions {
    supported: boolean;
    forced: boolean;
}

export function colorSupport(opts: ColorSupportOptions): void;
