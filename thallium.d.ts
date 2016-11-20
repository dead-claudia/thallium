export {
    Location, ReportType, Report, HookStage, HookError,
    StartReport, EnterReport, LeaveReport, PassReport, FailReport,
    SkipReport, EndReport, ErrorReport, HookReport,
    BeforeAllReport, BeforeEachReport, AfterEachReport, AfterAllReport,
    Reporter, ArgReporter, VoidReporter, ReporterConsumer,
    Plugin, ArgPlugin, VoidPlugin,
    Callback, Reflect, ReflectRoot, ReflectChild,
    Test, default as t,
} from "./index";

import * as assert from "./assert";
import * as match from "./match";
import * as r from "./r";
export {assert, match, r};

export {root, reports, hookErrors, location} from "./internal";

export namespace settings {
    export interface Setting<T> {
        get(): T;
        set(value: T): void;
    }

    export interface SymbolsEnum {
        Pass: string;
        Fail: string;
        Dot: string;
        DotFail: string;
    }

    export interface DefaultOptions {
        print(line: string): any | Promise<any>;
        write(line: string): any | Promise<any>;
        reset(): any | Promise<any>;
    }

    export interface ColorSupport {
        supported: boolean;
        forced: boolean;
    }

    export const windowWidth: Setting<number>;
    export const newline: Setting<string>;
    export const symbols: Setting<SymbolsEnum>;
    export const defaultOpts: Setting<DefaultOptions>;
    export const colorSupport: Setting<ColorSupport>;
}
