*[Up](../reflection.md)*

# reflect.checkInit

```js
reflect.checkInit()
```

Assert that this test is currently being initialized. If you are doing an operation that is affected by test state, you *must* check this so your users don't get surprised by their tests accidentally getting in an invalid state. If you're using [`reflect.add`](./add.md) or [`reflect.define`](./define.md)/[`t.define`](../define.md), this is already done for you, so you probably won't be calling this directly very often.
