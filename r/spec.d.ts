/* tslint:disable */

import {ReporterConsumer} from "../index.d";

export interface Options {
    write?(line: string): void | PromiseLike<void>;
    reset?(): void | PromiseLike<void>;
    color?: boolean;
}

export default function spec(options?: Options): ReporterConsumer;
export {default as spec};
