const { readFileSync } = require('node:fs');
const { dirname, resolve } = require('node:path');
const ts = require('typescript');

function readVersion(configFilePath, packagePath) {
  const dir = dirname(configFilePath);
  const pkgPath = packagePath
    ? resolve(dir, packagePath)
    : resolve(dir, 'package.json');

  try {
    const raw = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(raw);
    if (typeof pkg.version === 'string') {
      return pkg.version;
    }
  } catch {}

  throw new Error(`[version-transform] Cannot read version from ${pkgPath}`);
}

function versionTransformer(program, options) {
  const identifierName = (options && options.identifier) || '__VERSION__';

  const configFilePath = program.getCompilerOptions().configFilePath;
  if (!configFilePath) {
    throw new Error('[version-transform] Cannot determine tsconfig path');
  }

  const version = readVersion(configFilePath, options && options.packagePath);
  const versionLiteral = ts.factory.createStringLiteral(version);

  function visit(node) {
    if (ts.isIdentifier(node) && node.text === identifierName) {
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
      return versionLiteral;
    }
    return ts.visitEachChild(node, visit);
  }

  return function (ctx) {
    return function (sf) {
      return ts.visitEachChild(sf, visit, ctx);
    };
  };
}

module.exports = versionTransformer;
