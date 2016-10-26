# Assertions

Within `thallium/assert`, the built-in assertion library, there are literally 100 different assertions, as well as a few utility methods. I've separated them all into several groups, so it's a bit easier to parse and look through.

Do note that you don't have to use these, and matter of fact, any assertion library works with this. You could even use Chai if you wanted to. Consider this a useful built-in assertion library in case you prefer batteries included.

- [Basic methods/properties](#sec-basic)
- [Utility methods](#sec-utility)
- [Type checking](#sec-type)
- [Equality](#sec-equality)
- [Range checking](#sec-range)
- [Exception checking](#sec-exception)
- [Key checking](#sec-key)
- [Includes in array](#sec-includes)
- [Has key-value pairs in object](#sec-has)

<a id="sec-basic"></a>
## Basic methods/properties

Just like any assertion library, this has the obligatory basics.

### assert.assert(condition, message?)

```js
assert.assert(condition, message="")
```

The basic assert method. Most assertion libraries have some variant of this: test a `condition`, and if it's falsy, throw an assertion error with a `message`.

### assert.fail(message?)

```js
assert.fail(message="")
```

The basic automatic failure method. Most assertion libraries have some variant of this: throw an assertion error with a `message`.

### class assert.AssertionError

```js
new assert.AssertionError(message="", expected=undefined, actual=undefined)
```

The assertion error constructor used in this assertion library. Don't worry, it's only used here, and the rest of Thallium really doesn't care what assertion library you use, if any. It simply checks for the error's `name` to be `"AssertionError"`, nothing else.

<a id="sec-utility"></a>
## Utility methods

This also has several utility methods, so you can create your own assertions and still make them just as clean, neat, and native-looking as the built-in ones. No more of this:

```js
assert(something.isntRight(), "Something isn't right")
// AssertionError: Something isn't right
```

Instead, this could look like this, with beautiful error messages to match:

```js
if (something.isntRight()) {
    assert.fail("Something isn't right: expected {expected}, found {actual}", {
        expected: good,
        actual: bad,
    })
}
// AssertionError: Something isn't right: expected 1, found 2
```

### assert.format(message, args, formatter?)

```js
assert.format(message, args, prettify=util.inspect)
```

Create a formatted message from the template `message`, using `args` to fill it in and `prettify` to pretty-print it to a string.

### assert.fail(message, args, formatter?)

```js
assert.fail(message, args, prettify=util.inspect)
```

Throw a formatted assertion error, formatted with `assert.format`, and with `args.expected` and `args.actual` being passed directly to the `assert.AssertionError` constructor.

### assert.escape(string)

```js
assert.escape(string)
```

Escape a string so that `assert.format` returns the raw string instead of "pretty-printing" it (e.g. for function names injected into templates).

<a id="sec-type"></a>
## Type checking

There are several type checking-related assertions, engineered for clarity and conciseness.

### Truthy/falsy with assert.ok and assert.notOk

```js
assert.ok(value)
assert.notOk(value)
```

Assert whether a value is truthy or falsy.

### Primitive types

```js
assert.isBoolean(value)
assert.isFunction(value)
assert.isNumber(value)
assert.isObject(value)
assert.isString(value)
assert.isSymbol(value)
assert.notBoolean(value)
assert.notFunction(value)
assert.notNumber(value)
assert.notObject(value)
assert.notString(value)
assert.notSymbol(value)
```

Assert with `typeof` whether a value is of a certain primitive type.

Notes:

- If you want to test `typeof value === "undefined"`, use `assert.equal(value, null)` instead - having an extra method for just a single primitive value would be redundant.
- `assert.isObject(null)` will fail, even though `typeof null === "object"`. It's working around [one of the language's warts](http://www.2ality.com/2013/10/typeof-null.html) that sadly can't be fixed because [it breaks too many things](http://wiki.ecmascript.org/doku.php?id=harmony:typeof_null).

### Existence

```js
assert.exists(value)
assert.notExists(value)
```

Assert whether a value exists (i.e. either `null` or `undefined`)

### Arrays

```js
assert.isArray(value)
assert.notArray(value)
```

Assert whether a value is an array.

### Instance type

```js
assert.is(Type, value)
assert.not(Type, value)
```

Assert whether a value is `instanceof` an object type.

<a id="sec-equality"></a>
## Equality

There are also, of course, several equality methods.

### Primitive equality

```js
assert.equal(expected, actual)         // strict, expected === actual
assert.equalLoose(expected, actual)    // loose, expected == actual
assert.notEqual(expected, actual)      // strict, expected !== actual
assert.notEqualLoose(expected, actual) // loose, expected != actual
```

Assert whether a value equals another value, with strict or loose equality.

Note: if you're checking floats/decimals for equality, don't use this method, because it will frequently get things wrong. Use `assert.closeTo()` or `assert.notCloseTo()` (below) instead

### Floating point equality

```js
assert.closeTo(expected, actual, tolerance=1e-10)
assert.notCloseTo(expected, actual, tolerance=1e-10)
```

Assert whether a float/decimal is equal to a certain value, given an optional tolerance (since floats [have a habit](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) of [being imprecise](http://softwareengineering.stackexchange.com/a/101170)). This is the preferred way to compare two floats for equality.

The default tolerance is for convenience - you shouldn't need to specify how precise each time you compare two floats. Also, in case you're wondering, here's how it's checked (stops after the first step that works):

- If any number is `NaN`, it's not considered close.
- If the tolerance is infinite, it's considered close.
- If they're identical (with `===`), then it's considered close.
- If the tolerance is zero, then it's not considered close.
- If either float is zero, then the other is compared to the tolerance via `|value| < tolerance`
- Otherwise, it's compared to the tolerance via `|expected/actual - 1| < tolerance`

### Deep equality

```js
assert.deepEqual(expected, actual)
assert.match(expected, actual)
assert.notDeepEqual(expected, actual)
assert.notMatch(expected, actual)
```

Assert whether a value deeply equals another value. `deepEqual` and `notDeepEqual` check the prototypes as well, and use the [`match.strict`](./other.md#match-strict) method internally, but `match` and `notMatch` only check the properties (with a few caveats), and use the [`match.match`](./other.md#match-match) method internally. See the documentation for those two methods if you want more info.

<a id="sec-range"></a>
## Range checking

There are several methods to deal with ranges and inequalities.

```js
assert.atLeast(number, limit) // number >= limit
assert.atMost(number, limit) // number <= limit
assert.above(number, limit) // number > limit
assert.below(number, limit) // number < limit
assert.between(number, lower, upper) // lower <= number <= upper
```

Assert that a number is within some set of bounds. The comments detail what comparison is checked. Note that `between` is inclusive on both ends, and could be considered shorthand for the following:

```js
assert.between(number, lower, upper) // lower <= number <= upper
assert.atLeast(number, lower) // number >= limit
assert.atMost(number, upper) // number <= limit
```

<a id="sec-exception"></a>
## Exception checking

There are a few methods to deal with exceptions.

```js
assert.throws(callback)
assert.throws(Type, callback)
assert.throwsMatch(matcher, callback)
```

Assert that a callback throws, optionally either `instanceof Type` (for the first form) or matching a `matcher` (for the second form). In the case of the second, the `matcher` can be any of these:

- A string, which the error's message is checked to equal
- A regular expression, which the error's message is checked to match
- A function, which receives the error and has its result checked to be truthy
- An object literal, which those properties (not necessarily own) of the error are checked to be equal

<a id="sec-key"></a>
## Key checking

There are several key checking methods, for own object keys, inherited object keys, and map keys.

### Own keys

```js
assert.hasOwn(object, key)
assert.notHasOwn(object, key)
```

Assert whether an object has an own key.

```js
assert.hasOwn(object, key, value)
assert.hasOwnLoose(object, key, value)
assert.notHasOwn(object, key, value)
assert.notHasOwnLoose(object, key, value)
```

Assert whether an object has an own key either strictly (`===`/`!==`) or loosely (`==`/`!=`) equal to a value.

### Own or inherited keys

```js
assert.hasKey(object, key)
assert.notHasKey(object, key)
```

Assert whether an object has an own or inherited key. This even includes `Object.prototype` methods like `toString` for most objects.

```js
assert.hasKey(object, key, value)
assert.hasKeyLoose(object, key, value)
assert.notHasKey(object, key, value)
assert.notHasKeyLoose(object, key, value)
```

Assert whether an object has an own or inherited key either strictly (`===`/`!==`) or loosely (`==`/`!=`) equal to a value.

### Map keys

```js
assert.has(object, key)
assert.notHas(object, key)
```

Assert whether a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) has a key.

```js
assert.has(object, key, value)
assert.hasLoose(object, key, value)
assert.notHas(object, key, value)
assert.notHasLoose(object, key, value)
```

Assert whether a [map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) has a key either strictly (`===`/`!==`) or loosely (`==`/`!=`) equal to a value.

<a id="sec-includes"></a>
## Includes in array

There's also some larger methods to test many possibilities at once.

### Includes all values

```js
// Single
assert.includes(array, value)
assert.includesDeep(array, value)
assert.includesMatch(array, value)

// Multiple
assert.includes(array, [...values])
assert.includesDeep(array, [...values])
assert.includesMatch(array, [...values])
```

Assert an array includes one or more values.

### Includes some values

```js
assert.includesAny(array, [...values])
assert.includesAnyDeep(array, [...values])
assert.includesAnyMatch(array, [...values])
```

Assert an array includes at least one of a list of values

### Missing some values

```js
assert.notIncludesAll(array, [...values])
assert.notIncludesAllDeep(array, [...values])
assert.notIncludesAllMatch(array, [...values])
```

Assert an array is missing at least one of a list of values

### Missing all values

```js
// Single
assert.notIncludes(array, value)
assert.notIncludesDeep(array, value)
assert.notIncludesMatch(array, value)

// Multiple
assert.notIncludes(array, [...values])
assert.notIncludesDeep(array, [...values])
assert.notIncludesMatch(array, [...values])
```

Assert an array does not include one or more values.

<a id="sec-has"></a>
## Has key-value pairs in object

Just like testing for multiple values in arrays, you can also test for multiple key-value pairs in objects. These are checked to be own properties, not inherited, and it can be considered a more flexible shorthand for multiple `assert.hasOwn` calls.

### Has keys

```js
assert.hasKeys(object, [...keys]) // includes all
assert.hasKeysAny(object, [...keys]) // includes some
assert.notHasKeysAll(object, [...keys]) // missing some
assert.notHasKeys(object, [...keys]) // missing all
```

Assert whether an array has one or more keys. The comments detail how they're checked.

### Has all key-value pairs

```js
assert.hasKeys(object, {key: value, ...})
assert.hasKeysDeep(object, {key: value, ...})
assert.hasKeysMatch(object, {key: value, ...})
```

Assert an array includes one or more values.

### Has some key-value pairs

```js
assert.hasKeysAny(object, {key: value, ...})
assert.hasKeysAnyDeep(object, {key: value, ...})
assert.hasKeysAnyMatch(object, {key: value, ...})
```

Assert an array includes at least one of a list of values

### Missing some key-value pairs

```js
assert.notHasKeysAll(object, {key: value, ...})
assert.notHasKeysAllDeep(object, {key: value, ...})
assert.notHasKeysAllMatch(object, {key: value, ...})
```

Assert an array is missing at least one of a list of values

### Missing all key-value pairs

```js
assert.notHasKeys(object, {key: value, ...})
assert.notHasKeysDeep(object, {key: value, ...})
assert.notHasKeysMatch(object, {key: value, ...})
```

Assert an array does not include one or more values.
