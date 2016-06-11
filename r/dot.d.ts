/* tslint:disable */

import {Reporter, Callback} from "../core.d";

export interface DotOptions {
    print?(line: string, done: Callback<void>): any;
    write?(string: string, done: Callback<void>): any;
    reset?(done: Callback<void>): any;
    color?: boolean;
}

export default function dot(options: DotOptions): Reporter
