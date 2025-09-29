const esmToCjs = require("./index")

describe("esmToCjs", () => {
  it("converts default import", () => {
    const esm = 'import foo from "bar";'
    const cjs = esmToCjs(esm)
    expect(cjs).toEqual('const foo = require("bar")?.__esModule ? require("bar").default : require("bar");')
  })

  it("converts named import", () => {
    const esm = 'import { baz, qux as quux } from "bar";'
    const cjs = esmToCjs(esm)
    expect(cjs).toEqual('const { baz, qux: quux } = require("bar");')
  })

  it("converts namespace import", () => {
    const esm = 'import * as ns from "mod";'
    const cjs = esmToCjs(esm)
    expect(cjs).toEqual('const ns = require("mod");')
  })

  it("has a strictNamespaceImport option", () => {
    const esm = 'import * as ns from "mod";'
    const cjs = esmToCjs(esm, { strictNamespaceImport: true })
    expect(cjs).toEqual('const ns = require("mod")?.__esModule ? require("mod") : Object.assign(Object.create(null), { ...require("mod"), default: require("mod") });')
  })

  it("converts mixed default and named import", () => {
    const esm = 'import foo, { baz, default as qux } from "bar";'
    const cjs = esmToCjs(esm)
    expect(cjs).toEqual('const foo = require("bar")?.__esModule ? require("bar").default : require("bar"), qux = foo, { baz } = require("bar");')
  })

  it("converts side-effect import", () => {
    const esm = 'import "side";'
    const cjs = esmToCjs(esm)
    expect(cjs).toEqual('require("side");')
  })

  it("converts export named declaration", () => {
    const esm = 'export const a = 1, b = 2;\nexport function foo() {}'
    const cjs = esmToCjs(esm)
    expect(cjs).toEqual(
      'const a = 1, b = 2;\n' +
      'function foo() {}\n' +
      'Object.assign(exports, { a, b, foo });'
    )
  })

  it("converts export list", () => {
    const esm = 'const a = 1, b = 2;\nfunction foo() {}\nexport { a, b as c, foo };'
    const cjs = esmToCjs(esm)
    expect(cjs).toEqual(
      'const a = 1, b = 2;\n' +
      'function foo() {}\n' +
      '\nObject.assign(exports, { a, c: b, foo });'
    )
  })

  it("converts export default", () => {
    const esm = 'export default function foo() {}'
    const cjs = esmToCjs(esm)
     expect(cjs).toEqual('exports.default = function foo() {};')
  })

  it("converts named re-export", () => {
    const esm = 'export { a, b as c, default as foo } from "lib";'
    const cjs = esmToCjs(esm)
    expect(cjs).toEqual('exports.a = require("lib").a; exports.c = require("lib").b; exports.foo = require("lib")?.__esModule ? require("lib").default : require("lib");')
  })

  it("converts export all", () => {
    const esm = 'export * from "lib";'
    const cjs = esmToCjs(esm)
    expect(cjs).toEqual('Object.assign(exports, Object.fromEntries(Object.entries(require("lib")).filter(([k]) => k !== "default")));')
  })
})
