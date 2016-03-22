'use strict'

# For better NaN handling

export strictIs = (a, b) -> a == b or a != a and b != b
export looseIs = (a, b) -> a ~= b or a !~= a and b !~= b
