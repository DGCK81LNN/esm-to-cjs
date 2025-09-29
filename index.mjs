import { parse } from "acorn"

export default function esmToCjs(code, options) {
  const ast = parse(code, {
    ecmaVersion: "latest",
    sourceType: "module",
    ...options,
  })

  const clip = node => code.slice(node.start, node.end)
  const rewrite = (node, replacement) => {
    code =
      code.slice(0, node.start) +
      replacement +
      "\n".repeat(
        Math.max(0, clip(node).split("\n").length - replacement.split("\n").length)
      ) +
      code.slice(node.end)
  }

  const additionalExports = []

  for (let i = ast.body.length - 1; i >= 0; --i) {
    const statement = ast.body[i]
    switch (statement.type) {
      case "ImportDeclaration": {
        const src = statement.source.raw
        if (!statement.specifiers.length) {
          rewrite(statement, `require(${src});`)
        } else if (statement.specifiers[0].type === "ImportNamespaceSpecifier") {
          const m = options?.strictNamespaceImport
            ? `require(${src})?.__esModule ? require(${src}) : Object.assign(Object.create(null), { ...require(${src}), default: require(${src}) })`
            : `require(${src})`
          rewrite(statement, `const ${statement.specifiers[0].local.name} = ${m};`)
        } else {
          const specs = []
          const defaultNames = []
          const namedSpecs = []
          for (const spec of statement.specifiers) {
            if (
              spec.type === "ImportDefaultSpecifier" ||
              spec.imported.name === "default"
            )
              defaultNames.push(spec.local.name)
            else
              namedSpecs.push(
                spec.imported === spec.local
                  ? spec.local.name
                  : `${spec.imported.name}: ${spec.local.name}`
              )
          }
          if (defaultNames.length) {
            const first = defaultNames[0]
            specs.push(
              `${first} = require(${src})?.__esModule ? require(${src}).default : require(${src})`
            )
            for (const name of defaultNames.slice(1)) specs.push(`${name} = ${first}`)
          }
          if (namedSpecs.length)
            specs.push(`{ ${namedSpecs.join(", ")} } = require(${src})`)
          rewrite(statement, `const ${specs.join(", ")};`)
        }
        break
      }
      case "ExportNamedDeclaration": {
        if (statement.declaration) {
          const decl = statement.declaration
          if (decl.declarations)
            additionalExports.unshift(...decl.declarations.map(d => d.id.name))
          else additionalExports.unshift(decl.id.name)
          rewrite({ start: statement.start, end: statement.declaration.start }, "")
        } else if (statement.source) {
          const src = statement.source.raw
          const items = statement.specifiers.map(spec => {
            const val =
              spec.local.name === "default"
                ? `require(${src})?.__esModule ? require(${src}).default : require(${src})`
                : `require(${src}).${spec.local.name}`
            return `exports.${spec.exported.name} = ${val}`
          })
          rewrite(statement, items.join("; ") + ";")
        } else {
          additionalExports.unshift(
            ...statement.specifiers.map(spec =>
              spec.exported === spec.local
                ? spec.local.name
                : `${spec.exported.name}: ${spec.local.name}`
            )
          )
          rewrite(statement, "")
        }
        break
      }
      case "ExportAllDeclaration":
        rewrite(
          statement,
          `Object.assign(exports, Object.fromEntries(Object.entries(require(${statement.source.raw})).filter(([k]) => k !== "default")));`
        )
        break
      case "ExportDefaultDeclaration":
        rewrite(statement, `exports.default = ${clip(statement.declaration)};`)
        break
    }
  }

  if (additionalExports.length)
    code += `\nObject.assign(exports, { ${additionalExports.join(", ")} });`

  return code
}
