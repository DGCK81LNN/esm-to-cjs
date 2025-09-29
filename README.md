# @dgck81lnn/esm-to-cjs

![npm](https://img.shields.io/npm/v/@dgck81lnn/esm-to-cjs)

A simple ESM to CJS converter using acorn

~~~javascript
import esmToCjs from "esm-to-cjs"
// or
const esmToCjs = require("esm-to-cjs")

const cjsCode = esmToCjs('import { foo } from "bar"; export default foo')
// 'const { foo } = require("bar"); exports.default = foo;'
~~~
