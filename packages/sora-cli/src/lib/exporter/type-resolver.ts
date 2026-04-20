import * as ts from 'typescript';

import {type TransformedDeclaration} from './transformer';

interface ResolvedType {
  name: string;
  node: ts.Node;
  sourceFile: ts.SourceFile;
}

class TypeResolver {
  private visitedSymbols_ = new Set<ts.Symbol>();
  private collectedTypes_: ResolvedType[] = [];

  resolve(program: ts.Program, declarations: TransformedDeclaration[]): ResolvedType[] {
    const checker = program.getTypeChecker();

    for (const decl of declarations) {
      this.collectTypeDependencies(decl.node, checker, decl.sourceFile);
    }

    return this.collectedTypes_;
  }

  resolveForTargets(program: ts.Program, declarations: TransformedDeclaration[]): ResolvedType[] {
    return this.resolve(program, declarations);
  }

  private getDeclarations(symbol: ts.Symbol, checker: ts.TypeChecker): ts.Declaration[] {
    const decls = symbol.getDeclarations();
    if (decls && decls.length > 0) {
      const firstDecl = decls[0];
      if (ts.isImportSpecifier(firstDecl)) {
        try {
          const aliased = checker.getAliasedSymbol(symbol);
          if (aliased) {
            const aliasedDecls = aliased.getDeclarations();
            if (aliasedDecls && aliasedDecls.length > 0) {
              return aliasedDecls;
            }
          }
        } catch {
          // getAliasedSymbol can throw for non-alias symbols
        }
      }
    }
    return decls || [];
  }

  private collectTypeDependencies(node: ts.Node, checker: ts.TypeChecker, sourceFile: ts.SourceFile) {
    const visit = (child: ts.Node) => {
      if (ts.isTypeReferenceNode(child)) {
        this.resolveTypeReference(child, checker, sourceFile);
      } else if (ts.isIdentifier(child)) {
        this.resolveIdentifier(child, checker, sourceFile);
      }

      ts.forEachChild(child, visit);
    };

    ts.forEachChild(node, visit);
  }

  private resolveTypeReference(node: ts.TypeReferenceNode, checker: ts.TypeChecker, _sourceFile: ts.SourceFile) {
    const typeName = node.typeName;

    const symbol = checker.getSymbolAtLocation(typeName);
    if (!symbol) return;

    if (this.visitedSymbols_.has(symbol)) return;

    const declarations = this.getDeclarations(symbol, checker);
    if (!declarations || declarations.length === 0) return;

    for (const decl of declarations) {
      const declSourceFile = decl.getSourceFile();
      if (this.isBuiltInType(declSourceFile.fileName)) continue;

      if (this.visitedSymbols_.has(symbol)) continue;
      this.visitedSymbols_.add(symbol);

      this.collectResolvedDeclaration(decl, checker, declSourceFile);
    }
  }

  private resolveIdentifier(node: ts.Identifier, checker: ts.TypeChecker, _sourceFile: ts.SourceFile) {
    const symbol = checker.getSymbolAtLocation(node);
    if (!symbol) return;

    const declarations = this.getDeclarations(symbol, checker);
    if (!declarations || declarations.length === 0) return;

    for (const decl of declarations) {
      const declSourceFile = decl.getSourceFile();
      if (this.isBuiltInType(declSourceFile.fileName)) continue;

      if (ts.isInterfaceDeclaration(decl) || ts.isTypeAliasDeclaration(decl) || ts.isEnumDeclaration(decl)) {
        this.resolveTypeFromDeclaration(decl, checker);
      }
    }
  }

  private collectResolvedDeclaration(decl: ts.Node, checker: ts.TypeChecker, declSourceFile: ts.SourceFile) {
    if (ts.isInterfaceDeclaration(decl)) {
      const name = decl.name.text;
      const exported = ts.factory.updateInterfaceDeclaration(
        decl,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        decl.name,
        decl.typeParameters,
        decl.heritageClauses,
        decl.members,
      );
      this.collectedTypes_.push({name, node: exported, sourceFile: declSourceFile});
      this.collectTypeDependencies(exported, checker, declSourceFile);
    } else if (ts.isTypeAliasDeclaration(decl)) {
      const name = decl.name.text;
      const exported = ts.factory.updateTypeAliasDeclaration(
        decl,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        decl.name,
        decl.typeParameters,
        decl.type,
      );
      this.collectedTypes_.push({name, node: exported, sourceFile: declSourceFile});
      this.collectTypeDependencies(exported, checker, declSourceFile);
    } else if (ts.isEnumDeclaration(decl)) {
      const name = decl.name.text;
      const exported = ts.factory.updateEnumDeclaration(
        decl,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
        decl.name,
        decl.members,
      );
      this.collectedTypes_.push({name, node: exported, sourceFile: declSourceFile});
    } else if (ts.isClassDeclaration(decl)) {
      const name = decl.name?.text;
      if (!name) return;
      const exported = ts.factory.updateClassDeclaration(
        decl,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
        decl.name,
        decl.typeParameters,
        decl.heritageClauses,
        decl.members,
      );
      this.collectedTypes_.push({name, node: exported, sourceFile: declSourceFile});
      this.collectTypeDependencies(exported, checker, declSourceFile);
    }
  }

  private resolveTypeFromDeclaration(decl: ts.Node, checker: ts.TypeChecker) {
    const symbol = checker.getSymbolAtLocation(
      ts.isInterfaceDeclaration(decl) ? decl.name :
      ts.isTypeAliasDeclaration(decl) ? decl.name :
      ts.isEnumDeclaration(decl) ? decl.name :
      decl.getChildren()[0] as ts.Identifier
    );

    if (!symbol) return;
    if (this.visitedSymbols_.has(symbol)) return;

    const declSourceFile = decl.getSourceFile();

    if (ts.isInterfaceDeclaration(decl)) {
      this.visitedSymbols_.add(symbol);
      const name = decl.name.text;
      const exported = ts.factory.updateInterfaceDeclaration(
        decl,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        decl.name,
        decl.typeParameters,
        decl.heritageClauses,
        decl.members,
      );
      this.collectedTypes_.push({name, node: exported, sourceFile: declSourceFile});
      this.collectTypeDependencies(exported, checker, declSourceFile);
    } else if (ts.isTypeAliasDeclaration(decl)) {
      this.visitedSymbols_.add(symbol);
      const name = decl.name.text;
      const exported = ts.factory.updateTypeAliasDeclaration(
        decl,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
        decl.name,
        decl.typeParameters,
        decl.type,
      );
      this.collectedTypes_.push({name, node: exported, sourceFile: declSourceFile});
      this.collectTypeDependencies(exported, checker, declSourceFile);
    } else if (ts.isEnumDeclaration(decl)) {
      this.visitedSymbols_.add(symbol);
      const name = decl.name.text;
      const exported = ts.factory.updateEnumDeclaration(
        decl,
        [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword), ts.factory.createModifier(ts.SyntaxKind.DeclareKeyword)],
        decl.name,
        decl.members,
      );
      this.collectedTypes_.push({name, node: exported, sourceFile: declSourceFile});
    }
  }

  private isBuiltInType(fileName: string): boolean {
    const builtInPaths = ['/typescript/lib/', '/@types/node/', 'node_modules'];
    return builtInPaths.some(p => fileName.includes(p));
  }
}

export {TypeResolver};
export type {ResolvedType};
