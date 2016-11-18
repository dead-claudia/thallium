/* tslint:disable */

import {Reporter, Callback} from "../core.d";

export interface TapOptions {
    write?(line: string, done: Callback<void>): any;
    reset?(done: Callback<void>): any;
}

export default function tap(options: TapOptions): Reporter
