import * as ts from 'typescript';

import {AnnotationReader} from './annotation-reader';
import {type ExportClassInfo, type ExportSimpleInfo} from './types';

interface TransformedDeclaration {
  name: string;
  node: ts.Node;
  sourceFile: ts.SourceFile;
  originalNode?: ts.Node;
}

const FRAMEWORK_MODULE = '@sora-soft/framework';

const SORA_TAGS = new Set(['soraExport', 'soraTargets', 'soraIgnore']);

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

function stripSoraTagsFromComment(commentText: string): string {
  const lines = commentText.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    for (const tag of SORA_TAGS) {
      if (trimmed === `@${tag}` || trimmed.startsWith(`@${tag} `)) {
        return false;
      }
    }
    return true;
  });
  return filtered.join('\n').trim();
}

class Transformer {
  transform(
    program: ts.Program,
    routes: ExportClassInfo[],
    entities: ExportClassInfo[],
    simple: ExportSimpleInfo[],
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
        originalNode: classDecl,
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
        originalNode: classDecl,
      });
    }

    for (const simpleInfo of simple) {
      const sourceFile = program.getSourceFile(simpleInfo.filePath);
      if (!sourceFile) continue;

      if (simpleInfo.kind === 'class') {
        const classDecl = this.findClassDeclaration(sourceFile, simpleInfo.name);
        if (!classDecl) continue;

        const transformed = this.transformGenericClass(classDecl, sourceFile, targets);
        results.push({
          name: simpleInfo.name,
          node: transformed,
          sourceFile,
        });
      } else if (simpleInfo.kind === 'enum') {
        const decl = this.findEnumDeclaration(sourceFile, simpleInfo.name);
        if (!decl) continue;

        const transformed = this.transformEnum(decl);
        results.push({
          name: simpleInfo.name,
          node: transformed,
          sourceFile,
        });
      } else if (simpleInfo.kind === 'interface') {
        const decl = this.findInterfaceDeclaration(sourceFile, simpleInfo.name);
        if (!decl) continue;

        const transformed = this.transformInterface(decl);
        results.push({
          name: simpleInfo.name,
          node: transformed,
          sourceFile,
        });
      } else if (simpleInfo.kind === 'type') {
        const decl = this.findTypeAliasDeclaration(sourceFile, simpleInfo.name);
        if (!decl) continue;

        const transformed = this.transformTypeAlias(decl);
        results.push({
          name: simpleInfo.name,
          node: transformed,
          sourceFile,
        });
      }
    }

    return results;
  }

  private transformEnum(decl: ts.EnumDeclaration): ts.EnumDeclaration {
    const modifiers = this.ensureExport(decl);
    return ts.factory.updateEnumDeclaration(
      decl,
      modifiers,
      decl.name,
      decl.members,
    );
  }

  private transformInterface(decl: ts.InterfaceDeclaration): ts.InterfaceDeclaration {
    const modifiers = this.ensureExport(decl);
    return ts.factory.updateInterfaceDeclaration(
      decl,
      modifiers,
      decl.name,
      decl.typeParameters,
      decl.heritageClauses,
      decl.members,
    );
  }

  private transformTypeAlias(decl: ts.TypeAliasDeclaration): ts.TypeAliasDeclaration {
    const modifiers = this.ensureExport(decl);
    return ts.factory.updateTypeAliasDeclaration(
      decl,
      modifiers,
      decl.name,
      decl.typeParameters,
      decl.type,
    );
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

      if (!this.isRouteMethod(member, routeMethodImportMap)) continue;

      const ignoreModes = AnnotationReader.readMemberIgnore(member);
      if (ignoreModes !== null && this.shouldIgnoreMember(ignoreModes, targets)) continue;

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

      const ignoreModes = AnnotationReader.readMemberIgnore(member);
      if (ignoreModes !== null && this.shouldIgnoreMember(ignoreModes, targets)) continue;

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

      const ignoreModes = AnnotationReader.readMemberIgnore(member);
      if (ignoreModes !== null && this.shouldIgnoreMember(ignoreModes, targets)) continue;

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

  private findEnumDeclaration(sourceFile: ts.SourceFile, name: string): ts.EnumDeclaration | null {
    for (const statement of sourceFile.statements) {
      if (ts.isEnumDeclaration(statement) && statement.name.text === name) {
        return statement;
      }
    }
    return null;
  }

  private findInterfaceDeclaration(sourceFile: ts.SourceFile, name: string): ts.InterfaceDeclaration | null {
    for (const statement of sourceFile.statements) {
      if (ts.isInterfaceDeclaration(statement) && statement.name.text === name) {
        return statement;
      }
    }
    return null;
  }

  private findTypeAliasDeclaration(sourceFile: ts.SourceFile, name: string): ts.TypeAliasDeclaration | null {
    for (const statement of sourceFile.statements) {
      if (ts.isTypeAliasDeclaration(statement) && statement.name.text === name) {
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


  private ensureExport(node: ts.Declaration): ts.ModifierLike[] {
    const existing = ts.canHaveModifiers(node) ? (ts.getModifiers(node) || []) : [];
    const hasExport = existing.some(m => m.kind === ts.SyntaxKind.ExportKeyword);

    const result: ts.ModifierLike[] = [];
    if (!hasExport) result.push(ts.factory.createModifier(ts.SyntaxKind.ExportKeyword));
    result.push(...existing);
    return result;
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
