interface ComponentInstallContext {
  projectRoot: string;
  soraRoot: string;
  soraConfig: Record<string, any>;
  packageVersion: string;
  packageName: string;
  packageDir: string;
}

interface InstallQuestion {
  type: 'input' | 'number' | 'confirm' | 'select' | 'password';
  name: string;
  message: string;
  default?: string | number | boolean;
  choices?: Array<{name: string; value: string}>;
  validate?: (value: any) => boolean | string;
}

interface ComponentInfo {
  importStatement: string;
  enumKey: string;
  enumValue: string;
  staticFieldName: string;
  staticFieldExpression: string;
  registerCall: string;
}

interface DefineField {
  name: string;
  type: 'string' | 'number' | 'password' | 'host-ip' | 'select';
  hint: string;
  choices?: string[];
}

interface ConfigTemplateEntry {
  defines: DefineField[];
  content: Record<string, any>;
}

interface InstallHelpers {
  addComponentToCom(info: ComponentInfo): Promise<void>;
  appendToConfigTemplate(entry: ConfigTemplateEntry): Promise<void>;
  mergeJSON(targetPath: string, data: Record<string, any>): Promise<void>;
  copyFile(from: string, to: string): Promise<void>;
  writeFile(filePath: string, content: string | Buffer): Promise<void>;
  ensureDir(dirPath: string): Promise<void>;
  addWorkerToProject(options: {
    templatePath: string;
    templateData: Record<string, any>;
    workerNameKey: string;
    workerNameValue: string;
    workerClassName: string;
  }): Promise<void>;
  mergePackageScripts(scripts: Record<string, string>): Promise<void>;
  mergePackageDependencies(deps: { dependencies?: Record<string, string> }): Promise<void>;
  appendToCommandConfigTemplate(entry: ConfigTemplateEntry, createIfMissing?: boolean): Promise<void>;
  camelize(str: string, upper?: boolean): string;
  dashlize(str: string): string;
  log(message: string): void;
  warn(message: string): void;
}

interface ComponentInstallScript {
  prepare(ctx: ComponentInstallContext): Promise<InstallQuestion[]>;
  action(
    answers: Record<string, any>,
    ctx: ComponentInstallContext,
    helpers: InstallHelpers
  ): Promise<void>;
}

interface SoraComponentManifest {
  installScript: string;
}

export {
  ComponentInfo,
  ComponentInstallContext,
  ComponentInstallScript,
  ConfigTemplateEntry,
  DefineField,
  InstallHelpers,
  InstallQuestion,
  SoraComponentManifest,
};
