/* tslint:disable */

import {ReporterConsumer} from "../index.d";

export interface Options {
    write?(string: string): void | PromiseLike<void>;
    reset?(): void | PromiseLike<void>;
    color?: boolean;
}

export default function dot(options?: Options): ReporterConsumer;
export {default as dot};
