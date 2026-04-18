const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const versionCache = new Map();

function resolveVersion(filePath) {
  let dir = path.dirname(path.resolve(filePath));
  while (true) {
    const cached = versionCache.get(dir);
    if (cached !== undefined) return cached;

    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        if (typeof pkg.version === 'string') {
          versionCache.set(dir, pkg.version);
          return pkg.version;
        }
      } catch (_) {}
    }

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

module.exports = function (program, pluginOptions) {
  return (ctx) => {
    return (sourceFile) => {
      const version = resolveVersion(sourceFile.fileName);
      if (!version) return sourceFile;

      function visitor(node) {
        if (ts.isIdentifier(node) && node.text === '__VERSION__') {
          if (node.parent) {
            if (ts.isVariableDeclaration(node.parent) && node.parent.name === node) return node;
            if (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) return node;
            if (ts.isPropertyAssignment(node.parent) && node.parent.name === node) return node;
          }

          return ts.factory.createStringLiteral(version);
        }

        return ts.visitEachChild(node, visitor, ctx);
      }
      return ts.visitNode(sourceFile, visitor);
    };
  };
};
