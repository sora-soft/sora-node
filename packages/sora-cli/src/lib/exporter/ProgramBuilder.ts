import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

class ProgramBuilder {
  constructor(rootDir: string, tsconfigPath: string) {
    this.rootDir_ = rootDir;
    this.tsconfigPath_ = tsconfigPath;
  }

  build(): ts.Program {
    const files = this.collectTsFiles(this.rootDir_);
    const compilerOptions = this.loadCompilerOptions();

    const program = ts.createProgram(files, compilerOptions);
    return program;
  }

  getTypeChecker(program: ts.Program): ts.TypeChecker {
    return program.getTypeChecker();
  }

  private collectTsFiles(dir: string): string[] {
    const result: string[] = [];

    const walk = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, {withFileTypes: true});
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
            continue;
          }
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
          result.push(fullPath);
        }
      }
    };

    walk(dir);
    return result;
  }

  private loadCompilerOptions(): ts.CompilerOptions {
    const configFileName = this.tsconfigPath_ || ts.findConfigFile(this.rootDir_, ts.sys.fileExists, 'tsconfig.json');
    if (!configFileName) {
      return {
        target: ts.ScriptTarget.ESNext,
        module: ts.ModuleKind.CommonJS,
        strict: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      };
    }

    const configFile = ts.readConfigFile(configFileName, ts.sys.readFile);
    if (configFile.error) {
      throw new Error(`Failed to read tsconfig: ${configFile.error.messageText}`);
    }

    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configFileName));
    return parsed.options;
  }

  private rootDir_: string;
  private tsconfigPath_: string;
}

export {ProgramBuilder};
