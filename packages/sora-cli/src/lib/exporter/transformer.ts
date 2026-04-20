import * as ts from 'typescript';

import {type ExportClassInfo} from './types';

interface TransformedDeclaration {
  name: string;
  node: ts.Node;
  sourceFile: ts.SourceFile;
}

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

class Transformer {
  transform(
    program: ts.Program,
    routes: ExportClassInfo[],
    entities: ExportClassInfo[],
    generics: ExportClassInfo[],
    targets?: string[],
  ): TransformedDeclaration[] {
    const results: TransformedDeclaration[] = [];
    const checker = program.getTypeChecker();

    for (const routeInfo of routes) {
      const sourceFile = program.getSourceFile(routeInfo.filePath);
      if (!sourceFile) continue;

      const classDecl = this.findClassDeclaration(sourceFile, routeInfo.className);
      if (!classDecl) continue;

      const transformed = this.transformRouteClass(classDecl, sourceFile, routeInfo, targets, checker);
      results.push({
        name: routeInfo.className,
        node: transformed,
        sourceFile,
      });
    }

    for (const entityInfo of entities) {
      const sourceFile = program.getSourceFile(entityInfo.filePath);
      if (!sourceFile) continue;

      const classDecl = this.findClassDeclaration(sourceFile, entityInfo.className);
      if (!classDecl) continue;

      const transformed = this.transformEntityClass(classDecl, sourceFile, entityInfo, targets);
      results.push({
        name: entityInfo.className,
        node: transformed,
        sourceFile,
      });
    }

    for (const genericInfo of generics) {
      const sourceFile = program.getSourceFile(genericInfo.filePath);
      if (!sourceFile) continue;

      const classDecl = this.findClassDeclaration(sourceFile, genericInfo.className);
      if (!classDecl) continue;

      const transformed = this.transformGenericClass(classDecl, sourceFile, genericInfo, targets);
      results.push({
        name: genericInfo.className,
        node: transformed,
        sourceFile,
      });
    }

    return results;
  }

  transformEnum(
    program: ts.Program,
    enumName: string,
    filePath: string,
  ): TransformedDeclaration | null {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) return null;

    for (const statement of sourceFile.statements) {
      if (ts.isEnumDeclaration(statement) && statement.name.text === enumName) {
        const transformed = ts.factory.updateEnumDeclaration(
          statement,
          [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
          statement.name,
          statement.members,
        );

        return {
          name: enumName,
          node: transformed,
          sourceFile,
        };
      }
    }

    return null;
  }

  private transformRouteClass(
    classDecl: ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
    routeInfo: ExportClassInfo,
    targets: string[] | undefined,
    checker: ts.TypeChecker,
  ): ts.ClassDeclaration {
    const members: ts.ClassElement[] = [];
    const routeMethodImportMap = this.buildRouteMethodImportMap(sourceFile);

    for (const member of classDecl.members) {
      if (!ts.isMethodDeclaration(member)) continue;
      if (!member.name) continue;

      const methodName = member.name.getText(sourceFile);
      const methodDec = routeInfo.methodDecorations.find(md => md.methodName === methodName);

      if (!methodDec) continue;

      if (!this.isRouteMethod(member, routeMethodImportMap) && !methodDec.isRouteMethod) continue;

      if (this.shouldIgnoreMember(methodDec.modes, targets)) continue;

      const params = member.parameters.slice(0, 1);

      let returnType = member.type;
      if (!returnType) {
        const signature = checker.getSignatureFromDeclaration(member);
        if (signature) {
          const returnTypeNode = checker.typeToTypeNode(
            signature.getReturnType(),
            undefined,
            ts.NodeBuilderFlags.NoTruncation,
          );
          if (returnTypeNode) {
            returnType = returnTypeNode;
          }
        }
      }

      const newMethod = ts.factory.updateMethodDeclaration(
        member,
        [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
        undefined,
        member.name,
        member.questionToken,
        member.typeParameters,
        this.updateParameters(params, sourceFile),
        returnType,
        undefined,
      );

      members.push(newMethod);
    }

    return ts.factory.createClassDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
      classDecl.name,
      classDecl.typeParameters,
      undefined,
      members,
    );
  }

  private transformEntityClass(
    classDecl: ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
    entityInfo: ExportClassInfo,
    targets?: string[],
  ): ts.ClassDeclaration {
    const members: ts.ClassElement[] = [];

    for (const member of classDecl.members) {
      if (!ts.isPropertyDeclaration(member)) continue;
      if (!member.name) continue;

      if (this.hasModifier(member, ts.SyntaxKind.PrivateKeyword) ||
          this.hasModifier(member, ts.SyntaxKind.ProtectedKeyword) ||
          this.hasModifier(member, ts.SyntaxKind.StaticKeyword)) {
        continue;
      }

      const propName = member.name.getText(sourceFile);
      const propDec = entityInfo.propertyDecorations.find(pd => pd.propertyName === propName);

      if (propDec) {
        if (this.shouldIgnoreMember(propDec.modes, targets)) continue;
      }

      const newProp = ts.factory.updatePropertyDeclaration(
        member,
        [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
        member.name,
        member.questionToken,
        member.type,
        undefined,
      );

      members.push(newProp);
    }

    return ts.factory.createClassDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
      classDecl.name,
      classDecl.typeParameters,
      undefined,
      members,
    );
  }

  private transformGenericClass(
    classDecl: ts.ClassDeclaration,
    sourceFile: ts.SourceFile,
    genericInfo: ExportClassInfo,
    targets?: string[],
  ): ts.ClassDeclaration {
    const members: ts.ClassElement[] = [];

    for (const member of classDecl.members) {
      if (this.hasModifier(member, ts.SyntaxKind.PrivateKeyword) ||
          this.hasModifier(member, ts.SyntaxKind.ProtectedKeyword) ||
          this.hasModifier(member, ts.SyntaxKind.StaticKeyword)) {
        continue;
      }

      if (ts.isConstructorDeclaration(member)) continue;

      let shouldIgnore = false;

      if (ts.isMethodDeclaration(member) && member.name) {
        const methodName = member.name.getText(sourceFile);
        const methodDec = genericInfo.methodDecorations.find(md => md.methodName === methodName);
        if (methodDec) {
          shouldIgnore = this.shouldIgnoreMember(methodDec.modes, targets);
        }
      } else if (ts.isPropertyDeclaration(member) && member.name) {
        const propName = member.name.getText(sourceFile);
        const propDec = genericInfo.propertyDecorations.find(pd => pd.propertyName === propName);
        if (propDec) {
          shouldIgnore = this.shouldIgnoreMember(propDec.modes, targets);
        }
      }

      if (shouldIgnore) continue;

      if (ts.isMethodDeclaration(member)) {
        const newMethod = ts.factory.updateMethodDeclaration(
          member,
          [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
          undefined,
          member.name!,
          member.questionToken,
          member.typeParameters,
          member.parameters,
          member.type,
          undefined,
        );
        members.push(newMethod);
      } else if (ts.isPropertyDeclaration(member)) {
        const newProp = ts.factory.updatePropertyDeclaration(
          member,
          [ts.factory.createModifier(ts.SyntaxKind.PublicKeyword)],
          member.name!,
          member.questionToken,
          member.type,
          undefined,
        );
        members.push(newProp);
      }
    }

    return ts.factory.createClassDeclaration(
      [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
      classDecl.name,
      classDecl.typeParameters,
      undefined,
      members,
    );
  }

  private shouldIgnoreMember(memberIgnoreModes: string[] | null, targets?: string[]): boolean {
    if (memberIgnoreModes === null) return false;
    if (memberIgnoreModes.length === 0) return true;
    if (!targets || targets.length === 0) return false;
    return targets.some(t => memberIgnoreModes.includes(t));
  }

  private isRouteMethod(member: ts.MethodDeclaration, routeMethodImportMap: Map<string, Set<string>>): boolean {
    const decorators = getNodeDecorators(member);

    for (const decorator of decorators) {
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
    }

    return false;
  }

  private buildRouteMethodImportMap(sourceFile: ts.SourceFile): Map<string, Set<string>> {
    const map = new Map<string, Set<string>>();

    for (const statement of sourceFile.statements) {
      if (!ts.isImportDeclaration(statement)) continue;

      const moduleSpecifier = (statement.moduleSpecifier as ts.StringLiteral).text;
      const isFramework = moduleSpecifier === FRAMEWORK_MODULE ||
        moduleSpecifier.startsWith('@sora-soft/framework/');

      if (!isFramework) continue;

      const importClause = statement.importClause;
      if (!importClause?.namedBindings || !ts.isNamedImports(importClause.namedBindings)) continue;

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

    return map;
  }

  private findClassDeclaration(sourceFile: ts.SourceFile, className: string): ts.ClassDeclaration | null {
    for (const statement of sourceFile.statements) {
      if (ts.isClassDeclaration(statement) && statement.name?.text === className) {
        return statement;
      }
    }
    return null;
  }

  private hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
    if (ts.canHaveModifiers(node)) {
      const modifiers = ts.getModifiers(node) || [];
      return modifiers.some(m => m.kind === kind);
    }
    return false;
  }

  private updateParameters(params: readonly ts.ParameterDeclaration[], _sourceFile: ts.SourceFile): ts.NodeArray<ts.ParameterDeclaration> {
    const newParams = params.map(p => {
      return ts.factory.updateParameterDeclaration(
        p,
        undefined,
        p.dotDotDotToken,
        p.name,
        p.questionToken,
        p.type,
        undefined,
      );
    });
    return ts.factory.createNodeArray(newParams);
  }
}

export {Transformer};
export type {TransformedDeclaration};
