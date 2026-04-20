import * as ts from 'typescript';

import {type ExportClassInfo, type ExportEnumInfo, ExportStrategy, type MethodDecorationInfo, type PropertyDecorationInfo} from './types';

const FRAMEWORK_MODULE = '@sora-soft/framework';

function getNodeDecorators(node: ts.Node): ts.Decorator[] {
  if (ts.canHaveDecorators(node)) {
    const decs = ts.getDecorators(node);
    if (decs && decs.length > 0) return [...decs];
  }

  const nodeAny = node as any;
  if (nodeAny.modifiers) {
    const decs: ts.Decorator[] = [];
    for (const mod of nodeAny.modifiers as readonly ts.Node[]) {
      if (mod.kind === ts.SyntaxKind.Decorator) {
        decs.push(mod as ts.Decorator);
      }
    }
    if (decs.length > 0) return decs;
  }

  return [];
}

interface DecoratorInfo {
  type: 'route' | 'entity' | 'declare' | 'ignore';
  modes: string[];
}

class DecoratorReader {
  static readClassDecorators(
    node: ts.ClassDeclaration | ts.EnumDeclaration,
    sourceFile: ts.SourceFile,
    filePath: string,
  ): {exportDecorator?: DecoratorInfo; methodDecorations: MethodDecorationInfo[]; propertyDecorations: PropertyDecorationInfo[]} | null {
    const importMap = DecoratorReader.buildImportMap(sourceFile);
    const routeMethodImportMap = DecoratorReader.buildRouteMethodImportMap(sourceFile);

    if (ts.isEnumDeclaration(node)) {
      const enumName = node.name.text;
      for (const decorator of getNodeDecorators(node)) {
        const info = DecoratorReader.parseExportDecorator(decorator, importMap);
        if (info) {
          return {
            exportDecorator: info,
            methodDecorations: [],
            propertyDecorations: [],
          };
        }
      }
      return null;
    }

    const className = node.name?.text;
    if (!className) return null;

    let exportDecorator: DecoratorInfo | undefined;
    const methodDecorations: MethodDecorationInfo[] = [];
    const propertyDecorations: PropertyDecorationInfo[] = [];

    const decorators = getNodeDecorators(node);
    for (const decorator of decorators) {
      const info = DecoratorReader.parseExportDecorator(decorator, importMap);
      if (info) {
        if (exportDecorator) {
          throw new Error(`Class ${className} has multiple Export decorators. Only one is allowed.`);
        }
        exportDecorator = info;
      }
    }

    if (!exportDecorator) return null;

    for (const member of node.members) {
      const memberDecorators = getNodeDecorators(member);

      let ignoreModes: string[] | null = null;
      let isRouteMethod = false;

      for (const dec of memberDecorators) {
        const ignoreInfo = DecoratorReader.parseIgnoreDecorator(dec, importMap);
        if (ignoreInfo) {
          ignoreModes = ignoreInfo.modes;
        }

        if (DecoratorReader.isRouteMethodDecorator(dec, routeMethodImportMap)) {
          isRouteMethod = true;
        }
      }

      if (ts.isMethodDeclaration(member) && member.name) {
        const methodName = member.name.getText(sourceFile);
        methodDecorations.push({
          methodName,
          modes: ignoreModes,
          isRouteMethod,
        });
      } else if (ts.isPropertyDeclaration(member) && member.name) {
        const propName = member.name.getText(sourceFile);
        propertyDecorations.push({
          propertyName: propName,
          modes: ignoreModes,
        });
      }
    }

    return {
      exportDecorator,
      methodDecorations,
      propertyDecorations,
    };
  }

  static readEnumDeclaration(
    node: ts.EnumDeclaration,
    sourceFile: ts.SourceFile,
    filePath: string,
  ): ExportEnumInfo | null {
    const importMap = DecoratorReader.buildImportMap(sourceFile);

    const decorators = getNodeDecorators(node);
    for (const decorator of decorators) {
      const info = DecoratorReader.parseExportDecorator(decorator, importMap);
      if (info && info.type === 'declare') {
        return {
          filePath,
          enumName: node.name.text,
          modes: info.modes,
        };
      }
    }
    return null;
  }

  static readClassDeclaration(
    node: ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
    filePath: string,
  ): ExportClassInfo | null {
    const result = DecoratorReader.readClassDecorators(node, sourceFile, filePath);
    if (!result?.exportDecorator) return null;

    const className = node.name!.text;
    const dec = result.exportDecorator;

    let strategy: ExportStrategy;
    switch (dec.type) {
      case 'route':
        strategy = ExportStrategy.Route;
        break;
      case 'entity':
        strategy = ExportStrategy.Entity;
        break;
      default:
        strategy = ExportStrategy.Generic;
        break;
    }

    return {
      filePath,
      className,
      strategy,
      modes: dec.modes,
      methodDecorations: result.methodDecorations,
      propertyDecorations: result.propertyDecorations,
    };
  }

  private static buildImportMap(sourceFile: ts.SourceFile): Map<string, string> {
    const map = new Map<string, string>();

    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement)) continue;

      const moduleSpecifier = (statement.moduleSpecifier as ts.StringLiteral).text;
      const isFramework = moduleSpecifier === FRAMEWORK_MODULE ||
        moduleSpecifier.startsWith('@sora-soft/framework/') ||
        moduleSpecifier.startsWith(FRAMEWORK_MODULE + '/');

      if (!isFramework) continue;

      const importClause = statement.importClause;
      if (!importClause) continue;

      if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          const localName = element.name.text;
          const importedName = element.propertyName?.text || localName;
          map.set(localName, importedName);
        }
      }

      if (importClause.name) {
        map.set(importClause.name.text, 'default');
      }
    }

    return map;
  }

  private static buildRouteMethodImportMap(sourceFile: ts.SourceFile): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();

    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement)) continue;

      const moduleSpecifier = (statement.moduleSpecifier as ts.StringLiteral).text;
      const isFramework = moduleSpecifier === FRAMEWORK_MODULE ||
        moduleSpecifier.startsWith('@sora-soft/framework/') ||
        moduleSpecifier.startsWith(FRAMEWORK_MODULE + '/');

      if (!isFramework) continue;

      const importClause = statement.importClause;
      if (!importClause) continue;

      if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          const localName = element.name.text;
          const importedName = element.propertyName?.text || localName;
          if (importedName === 'Route') {
            const methods = map.get(localName) || new Set<string>();
            methods.add('method');
            methods.add('notify');
            map.set(localName, methods);
          }
        }
      }
    }

    return map;
  }

  private static parseExportDecorator(decorator: ts.Decorator, importMap: Map<string, string>): DecoratorInfo | null {
    const expr = decorator.expression;

    if (ts.isCallExpression(expr)) {
      const callee = expr.expression;

      if (ts.isPropertyAccessExpression(callee)) {
        const objectName = callee.expression.getText();
        const methodName = callee.name.text;

        const importedAs = importMap.get(objectName);
        if (importedAs !== 'Export') return null;

        if (methodName === 'route' || methodName === 'entity' || methodName === 'declare') {
          const modes = DecoratorReader.extractModes(expr);
          return {type: methodName, modes};
        }
      }
    }

    return null;
  }

  private static parseIgnoreDecorator(decorator: ts.Decorator, importMap: Map<string, string>): DecoratorInfo | null {
    const expr = decorator.expression;

    if (ts.isCallExpression(expr)) {
      const callee = expr.expression;

      if (ts.isPropertyAccessExpression(callee)) {
        const objectName = callee.expression.getText();
        const methodName = callee.name.text;

        const importedAs = importMap.get(objectName);
        if (importedAs !== 'Export') return null;

        if (methodName === 'ignore') {
          const modes = DecoratorReader.extractModes(expr);
          return {type: 'ignore', modes};
        }
      }
    }

    return null;
  }

  private static isRouteMethodDecorator(decorator: ts.Decorator, routeMethodImportMap: Map<string, Set<string>>): boolean {
    const expr = decorator.expression;

    if (ts.isPropertyAccessExpression(expr)) {
      const objectName = expr.expression.getText();
      const methodName = expr.name.text;

      const routeMethods = routeMethodImportMap.get(objectName);
      if (routeMethods && routeMethods.has(methodName)) {
        return true;
      }
    }

    if (ts.isCallExpression(expr)) {
      const callee = expr.expression;
      if (ts.isPropertyAccessExpression(callee)) {
        const objectName = callee.expression.getText();
        const methodName = callee.name.text;

        const routeMethods = routeMethodImportMap.get(objectName);
        if (routeMethods && routeMethods.has(methodName)) {
          return true;
        }
      }
    }

    return false;
  }

  private static extractModes(callExpr: ts.CallExpression): string[] {
    if (callExpr.arguments.length === 0) return [];

    const firstArg = callExpr.arguments[0];
    if (ts.isArrayLiteralExpression(firstArg)) {
      return firstArg.elements.map(el => {
        if (ts.isStringLiteral(el)) return el.text;
        return el.getText();
      });
    }

    return [];
  }
}

export {DecoratorReader};
