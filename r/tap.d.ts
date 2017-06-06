/* tslint:disable */

import {ReporterConsumer} from "../index.d";

export interface Options {
    write?(line: string): void | PromiseLike<void>;
    reset?(): void | PromiseLike<void>;
}

export default function tap(options?: Options): ReporterConsumer;
export {default as tap};
