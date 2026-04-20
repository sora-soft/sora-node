import * as ts from 'typescript';

import {DecoratorReader} from './decorator-reader';
import {type ExportClassInfo, type ExportEnumInfo, type ExportPlan} from './types';

class Collector {
  collect(program: ts.Program): ExportPlan {
    const plan: ExportPlan = {
      routes: [],
      entities: [],
      generics: [],
      enums: [],
    };

    const checker = program.getTypeChecker();

    for (const sourceFile of program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) continue;
      if (sourceFile.fileName.includes('node_modules')) continue;

      this.visitSourceFile(sourceFile, plan);
    }

    return plan;
  }

  filterByTarget(plan: ExportPlan, targets: string[] | undefined): ExportPlan {
    if (!targets || targets.length === 0) {
      return plan;
    }

    const filterClass = (items: ExportClassInfo[]) => {
      return items.filter(item => {
        if (item.modes.length === 0) return true;
        return targets.some(t => item.modes.includes(t));
      });
    };

    const filterEnums = (items: ExportEnumInfo[]) => {
      return items.filter(item => {
        if (item.modes.length === 0) return true;
        return targets.some(t => item.modes.includes(t));
      });
    };

    return {
      routes: filterClass(plan.routes),
      entities: filterClass(plan.entities),
      generics: filterClass(plan.generics),
      enums: filterEnums(plan.enums),
    };
  }

  private visitSourceFile(sourceFile: ts.SourceFile, plan: ExportPlan) {
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node)) {
        const info = DecoratorReader.readClassDeclaration(node, sourceFile, sourceFile.fileName);
        if (info) {
          switch (info.strategy) {
            case 'route':
              plan.routes.push(info);
              break;
            case 'entity':
              plan.entities.push(info);
              break;
            case 'generic':
              plan.generics.push(info);
              break;
          }
        }
      } else if (ts.isEnumDeclaration(node)) {
        const info = DecoratorReader.readEnumDeclaration(node, sourceFile, sourceFile.fileName);
        if (info) {
          plan.enums.push(info);
        }
      }
    });
  }
}

export {Collector};
