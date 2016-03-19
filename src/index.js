/**
 * Main entry point, for those wanting to use this framework with the core
 * assertions.
 */
import Techtonic from "./techtonic.js"
import assertions from "./assertions.js"

export default new Techtonic().use(assertions)
