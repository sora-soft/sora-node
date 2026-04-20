import * as ts from 'typescript';

import {AnnotationReader} from '../exporter/annotation-reader';
import {Collector} from '../exporter/collector';
import {type ExportClassInfo, type ExportPlan} from '../exporter/types';

export interface DocExportPlan {
  routes: DocRouteInfo[];
}

export interface DocRouteInfo {
  filePath: string;
  className: string;
  modes: string[];
  prefixes: string[];
}

class DocCollector {
  collect(program: ts.Program): DocExportPlan {
    const collector = new Collector();
    const fullPlan: ExportPlan = collector.collect(program);

    const routes: DocRouteInfo[] = [];

    for (const routeInfo of fullPlan.routes) {
      const sourceFile = program.getSourceFile(routeInfo.filePath);
      if (!sourceFile) continue;

      const classDecl = this.findClassDeclaration(sourceFile, routeInfo.className);
      if (!classDecl) continue;

      const prefixes = AnnotationReader.readPrefix(classDecl);

      routes.push({
        filePath: routeInfo.filePath,
        className: routeInfo.className,
        modes: routeInfo.modes,
        prefixes: prefixes || ['/'],
      });
    }

    return {routes};
  }

  filterByTarget(plan: DocExportPlan, targets: string[] | undefined): DocExportPlan {
    if (!targets || targets.length === 0) {
      return plan;
    }

    return {
      routes: plan.routes.filter(item => {
        if (item.modes.length === 0) return true;
        return targets.some(t => item.modes.includes(t));
      }),
    };
  }

  private findClassDeclaration(sourceFile: ts.SourceFile, className: string): ts.ClassDeclaration | null {
    for (const statement of sourceFile.statements) {
      if (ts.isClassDeclaration(statement) && statement.name?.text === className) {
        return statement;
      }
    }
    return null;
  }
}

export {DocCollector};
