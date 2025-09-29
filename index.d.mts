export interface Options extends import("acorn").Options {
  strictNamespaceImport?: boolean
}

function esmToCjs(code: string, options?: Options): string
export default esmToCjs
