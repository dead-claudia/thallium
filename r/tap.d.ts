/* tslint:disable */

import {ReporterConsumer} from "../index.d";

export interface TapOptions {
    write?(line: string): void | PromiseLike<void>;
    reset?(): void | PromiseLike<void>;
}

export function tap(options?: TapOptions): ReporterConsumer;
