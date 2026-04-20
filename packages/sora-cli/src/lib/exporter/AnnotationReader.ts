import * as ts from 'typescript';

export interface AnnotationInfo {
  type?: 'route' | 'entity';
  modes: string[];
}

function getNodeTags(node: ts.Node): ts.JSDocTag[] {
  const jsDocs = (node as any).jsDoc as Array<{ tags?: ts.JSDocTag[] }> | undefined;
  if (!jsDocs) return [];

  const result: ts.JSDocTag[] = [];
  for (const jsDoc of jsDocs) {
    if (jsDoc.tags) {
      result.push(...jsDoc.tags);
    }
  }
  return result;
}

function getTagName(tag: ts.JSDocTag): string {
  return tag.tagName.text;
}

class AnnotationReader {
  static readPrefix(node: ts.Node): string[] | null {
    const tags = getNodeTags(node);
    for (const tag of tags) {
      if (getTagName(tag) === 'soraPrefix') {
        const comment = AnnotationReader.extractTagComment(tag);
        return comment.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    return null;
  }

  static readHttpMethod(node: ts.Node): string | null {
    const tags = getNodeTags(node);
    for (const tag of tags) {
      if (getTagName(tag) === 'method') {
        return AnnotationReader.extractTagComment(tag).trim();
      }
    }
    return null;
  }

  static readDeclaration(node: ts.Node): AnnotationInfo | null {
    const tags = getNodeTags(node);

    const soraExportTags = tags.filter(tag => {
      return getTagName(tag) === 'soraExport';
    });

    if (soraExportTags.length === 0) return null;

    if (soraExportTags.length > 1) {
      const declName = AnnotationReader.getDeclarationName(node);
      throw new Error(`${declName}: 一个声明只能有一个 @soraExport 标记`);
    }

    const exportTag = soraExportTags[0];
    const comment = AnnotationReader.extractTagComment(exportTag);
    const trimmed = comment.trim();

    let type: 'route' | 'entity' | undefined;
    if (trimmed === 'route') {
      type = 'route';
    } else if (trimmed === 'entity') {
      type = 'entity';
    }

    const modes = AnnotationReader.readModes(tags);

    return {type, modes};
  }

  static readMemberIgnore(node: ts.Node): string[] | null {
    const tags = getNodeTags(node);
    const ignoreTags = tags.filter(tag => {
      return getTagName(tag) === 'soraIgnore';
    });

    if (ignoreTags.length === 0) return null;

    const ignoreModes = AnnotationReader.readModes(tags);
    return ignoreModes;
  }

  static readModes(tags: readonly ts.JSDocTag[]): string[] {
    for (const tag of tags) {
      if (getTagName(tag) === 'soraTargets') {
        const comment = AnnotationReader.extractTagComment(tag);
        return comment.split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    }
    return [];
  }

  static extractTagComment(tag: ts.JSDocTag): string {
    if (typeof tag.comment === 'string') {
      return tag.comment;
    }

    if (Array.isArray(tag.comment)) {
      return tag.comment
        .map(part => {
          if (typeof part === 'string') return part;
          if (part.text) return part.text;
          return '';
        })
        .join('')
        .trim();
    }

    return '';
  }

  private static getDeclarationName(node: ts.Node): string {
    if (ts.isClassDeclaration(node) && node.name) return node.name.text;
    if (ts.isEnumDeclaration(node)) return node.name.text;
    if (ts.isInterfaceDeclaration(node)) return node.name.text;
    if (ts.isTypeAliasDeclaration(node)) return node.name.text;
    return '<unknown>';
  }
}

export {AnnotationReader};
