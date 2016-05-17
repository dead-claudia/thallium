# Assertions

This is a work in progress with literally about 100 distinct methods to individually document. For now, please consult the `thallium/assertions` module in the [TypeScript definition file](../definitions.d.ts) for an overview of the various assertions. The methods are generally self-explanatory.

Do note that you don't have to use these. If you use `thallium/core`, the `thallium/assertions` module isn't even loaded. You can also use `t.base()` on any Thallium instance to the same effect. Then you can define your own assertions pretty easily using the API.
