import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function prepare(ctx) {
  return [
    {
      type: 'input',
      name: 'componentName',
      message: 'Component name (e.g., business-database)',
      default: 'database',
    },
    {
      type: 'input',
      name: 'enumKey',
      message: 'ComponentName enum key (e.g., BusinessDB)',
      default: 'BusinessDB'
    },
    {
      type: 'input',
      name: 'migrationPath',
      message: 'Where to put migration files?',
      default: 'app/database/migration',
    },
  ];
}

export async function action(answers, ctx, helpers) {
  const { componentName, enumKey, migrationPath } = answers;
  const fieldName = helpers.camelize(componentName, false);
  const packageName = ctx.packageName;

  // Phase 1: Component registration (existing)
  await helpers.addComponentToCom({
    importStatement: `import {DatabaseComponent} from '${packageName}'`,
    enumKey,
    enumValue: componentName,
    staticFieldName: fieldName,
    staticFieldExpression: `new DatabaseComponent([])`,
    registerCall: `Runtime.registerComponent(ComponentName.${enumKey}, this.${fieldName})`,
  });

  if (migrationPath) {
    await helpers.ensureDir(migrationPath);

    await helpers.mergeJSON(
      '../sora.json',
      {
        migration: migrationPath,
        databaseDir: migrationPath.split('/').slice(0, -1).join('/') || 'app/database',
      },
    );
  }

  const varPrefix = componentName.replace(/-/g, '_');
  await helpers.appendToConfigTemplate({
    defines: [
      { name: `${varPrefix}_type`, type: 'select', choices: ['mysql', 'postgres', 'mariadb', 'sqlite'], hint: `${componentName} database type` },
      { name: `${varPrefix}_host`, type: 'string', hint: `${componentName} database host` },
      { name: `${varPrefix}_port`, type: 'number', hint: `${componentName} database port` },
      { name: `${varPrefix}_username`, type: 'string', hint: `${componentName} database username` },
      { name: `${varPrefix}_password`, type: 'password', hint: `${componentName} database password` },
      { name: `${varPrefix}_database`, type: 'string', hint: `${componentName} database name` },
    ],
    content: {
      components: {
        [componentName]: {
          database: {
            type: `$(${varPrefix}_type)`,
            host: `$(${varPrefix}_host)`,
            port: `$(${varPrefix}_port)`,
            'username*': `$(${varPrefix}_username)`,
            'password*': `$(${varPrefix}_password)`,
            database: `$(${varPrefix}_database)`,
          },
        },
      },
    },
  });

  // Phase 2: Generate DatabaseMigrateCommandWorker
  const workerDir = ctx.soraConfig.workerDir;
  const workerFileExPath = path.join(workerDir, 'DatabaseMigrateCommandWorker.ts');

  const [comFilePath] = ctx.soraConfig.comClass.split('#');
  const [workerNameFilePath, workerNameEnum] = ctx.soraConfig.workerNameEnum.split('#');

  const comImportPath = path.relative(path.dirname(workerFileExPath), comFilePath).replace(/\\/g, '/');
  const workerNameImportPath = path.relative(path.dirname(workerFileExPath), workerNameFilePath).replace(/\\/g, '/');
  const comImportPathResolved = comImportPath.startsWith('.') ? comImportPath : './' + comImportPath;
  const workerNameImportPathResolved = workerNameImportPath.startsWith('.') ? workerNameImportPath : './' + workerNameImportPath;

  const templatePath = path.resolve(__dirname, 'templates', 'DatabaseMigrateCommandWorker.ts.art');

  await helpers.addWorkerToProject({
    templatePath,
    templateData: {
      comImportPath: comImportPathResolved + '.js',
      workerNameImportPath: workerNameImportPathResolved + '.js',
      workerNameEnum,
      componentName,
    },
    workerNameKey: 'DatabaseMigrateCommand',
    workerNameValue: 'database-migrate-command',
    workerClassName: 'DatabaseMigrateCommandWorker',
  });

  // Phase 3: Package scripts, dependencies, command config
  const cliEntry = 'node ./bin/cli.js';
  const commandBase = `${cliEntry} command --config ./config-command.yml -w ./run -n database-migrate-command`;

  await helpers.mergePackageScripts({
    'migrate:sync': `${commandBase} sync`,
    'migrate': `${commandBase} migrate`,
    'migrate:drop': `${commandBase} drop`,
    'migrate:revert': `${commandBase} revert`,
    'migrate:generate': `${commandBase} generate`,
  });

  await helpers.mergePackageDependencies({
    dependencies: {
      'camelcase': '^6.2.0',
      'mkdirp': '^2.1.5',
      'moment': '^2.29.1',
    },
  });

  await helpers.appendToCommandConfigTemplate({
    defines: [
      { name: `${varPrefix}_type`, type: 'select', choices: ['mysql', 'postgres', 'mariadb', 'sqlite'], hint: `${componentName} database type` },
      { name: `${varPrefix}_host`, type: 'string', hint: `${componentName} database host` },
      { name: `${varPrefix}_port`, type: 'number', hint: `${componentName} database port` },
      { name: `${varPrefix}_username`, type: 'string', hint: `${componentName} database username` },
      { name: `${varPrefix}_password`, type: 'password', hint: `${componentName} database password` },
      { name: `${varPrefix}_database`, type: 'string', hint: `${componentName} database name` },
    ],
    content: {
      components: {
        [componentName]: {
          database: {
            type: `$(${varPrefix}_type)`,
            host: `$(${varPrefix}_host)`,
            port: `$(${varPrefix}_port)`,
            'username*': `$(${varPrefix}_username)`,
            'password*': `$(${varPrefix}_password)`,
            database: `$(${varPrefix}_database)`,
          },
        },
      },
      workers: {
        'database-migrate-command': {
          components: [componentName],
        },
      },
    },
  });

  helpers.log('! Add TypeORM entities to DatabaseComponent constructor in Com.ts');
  helpers.log('! Run "npm install" to install new dependencies: camelcase, mkdirp, moment');
}
