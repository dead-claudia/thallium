/* tslint:disable */

import {Reporter, Callback} from "../core.d";

export interface SpecOptions {
    write?(line: string, done: Callback<void>): any;
    reset?(done: Callback<void>): any;
    color?: boolean;
}

export default function spec(options: SpecOptions): Reporter
