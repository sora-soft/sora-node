import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as ts from 'typescript';

type DefineSource =
  | { type: 'pkg'; field: string }
  | { type: 'env'; key: string }
  | { type: 'literal'; value: unknown };

interface DefineTransformOptions {
  defines: Record<string, string | { pkg?: string; env?: string; literal?: unknown }>;
  packagePath?: string;
}

function valueToNode(value: unknown): ts.Expression {
  if (typeof value === 'string') return ts.factory.createStringLiteral(value);
  if (typeof value === 'number') return ts.factory.createNumericLiteral(String(value));
  if (value === true) return ts.factory.createTrue();
  if (value === false) return ts.factory.createFalse();
  if (value === null) return ts.factory.createNull();
  throw new Error(`[define-transform] Unsupported literal type: ${typeof value}`);
}

function resolveDefine(define: string | { pkg?: string; env?: string; literal?: unknown }): DefineSource {
  if (typeof define === 'string') {
    return { type: 'pkg', field: define };
  }
  if (define && typeof define === 'object') {
    if ('pkg' in define && define.pkg !== undefined) return { type: 'pkg', field: define.pkg };
    if ('env' in define && define.env !== undefined) return { type: 'env', key: define.env };
    if ('literal' in define) return { type: 'literal', value: define.literal };
  }
  throw new Error(`[define-transform] Invalid define value: ${JSON.stringify(define)}`);
}

function resolveValue(source: DefineSource, configFilePath: string, packagePath?: string): unknown {
  switch (source.type) {
    case 'pkg': {
      const dir = dirname(configFilePath);
      const pkgPath = packagePath ? resolve(dir, packagePath) : resolve(dir, 'package.json');
      let pkg: Record<string, unknown>;
      try {
        pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      } catch {
        throw new Error(`[define-transform] Cannot read ${pkgPath}`);
      }
      const value = pkg[source.field];
      if (typeof value !== 'string') {
        throw new Error(`[define-transform] Field "${source.field}" not found or not a string in ${pkgPath}`);
      }
      return value;
    }
    case 'env':
      return process.env[source.key] ?? '';
    case 'literal':
      return source.value;
  }
}

export default function defineTransformer(
  program: ts.Program,
  options?: DefineTransformOptions,
): ts.TransformerFactory<ts.SourceFile> {
  const opts = options ?? ({} as DefineTransformOptions);
  const defines = opts.defines;
  if (!defines || typeof defines !== 'object') {
    throw new Error('[define-transform] "defines" option is required');
  }

  const configFilePath = program.getCompilerOptions().configFilePath as string | undefined;
  if (!configFilePath) {
    throw new Error('[define-transform] Cannot determine tsconfig path');
  }

  const replacements = new Map<string, ts.Expression>();
  for (const [name, def] of Object.entries(defines)) {
    const source = resolveDefine(def);
    const value = resolveValue(source, configFilePath, opts.packagePath);
    replacements.set(name, valueToNode(value));
  }

  return (ctx: ts.TransformationContext) => {
    function visit(node: ts.Node): ts.VisitResult<ts.Node> {
      if (ts.isIdentifier(node) && replacements.has(node.text)) {
        const parent = node.parent;
        if (parent && (ts.isPropertyAssignment(parent) || ts.isPropertyDeclaration(parent)) && parent.name === node) {
          return node;
        }
        if (parent && ts.isPropertyAccessExpression(parent) && parent.name === node) {
          return node;
        }
        if (parent && ts.isQualifiedName(parent) && parent.right === node) {
          return node;
        }
        return replacements.get(node.text)!;
      }
      return ts.visitEachChild(node, visit, ctx);
    }

    return (sf: ts.SourceFile) => {
      return ts.visitEachChild(sf, visit, ctx);
    };
  };
}
