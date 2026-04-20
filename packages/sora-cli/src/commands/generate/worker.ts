import {flags as oclifFlags} from '@oclif/command';
import inquirer = require('inquirer');
import template = require('art-template');
import path = require('path');

import {BaseCommand} from '../../Base';
import {CodeInserter} from '../../lib/ast/CodeInserter';
import {type ScriptFileNode} from '../../lib/fs/ScriptFileNode';
import {Utility} from '../../lib/Utility';

export default class GenerateWorker extends BaseCommand {
  static description = 'Generate a new worker';

  static args = [
    {name: 'name', description: 'Worker name'},
  ];

  static flags = {
    ...BaseCommand.flags,
    standalone: oclifFlags.boolean({description: 'Generate as SingletonWorker'}),
    'dry-run': oclifFlags.boolean({description: 'Show what would be generated without writing'}),
  };

  async run() {
    const {args, flags} = this.parse(GenerateWorker);
    await this.loadConfig();

    let name: string | undefined = args.name as string | undefined;
    let standalone: boolean | undefined = flags.standalone;

    if (!name) {
      const answers = await inquirer.prompt<{name: string}>([
        {name: 'name', message: 'Worker name?'},
      ]);
      name = answers.name;
    }

    if (standalone === undefined) {
      const answers = await inquirer.prompt<{standalone: boolean}>([
        {name: 'standalone', message: 'Standalone mode?', type: 'confirm', default: false},
      ]);
      standalone = answers.standalone;
    }

    const upperCamelCaseWorkerName = Utility.camelize(name, true);
    const upperCamelCaseWorkerFullName = `${upperCamelCaseWorkerName}Worker`;

    const [workerNameFilePath, workerNameEnum] = this.soraConfig.sora.workerNameEnum.split('#');
    const workerFilePath = path.join(this.soraConfig.sora.workerDir, `${upperCamelCaseWorkerName}Worker`);
    const workerFileExPath = path.join(this.soraConfig.sora.workerDir, `${upperCamelCaseWorkerName}Worker.ts`);
    const workerNameWorkerRelativePath = Utility.resolveImportPath(workerFileExPath, workerNameFilePath) + '.js';

    const [workerRegisterFilePath, registerMethodPath] = this.soraConfig.sora.workerRegister.split('#');
    const [workerRegisterClass, workerRegisterMethod] = registerMethodPath.split('.');

    const existedFile = this.fileTree.getFile(workerFileExPath);
    if (existedFile)
      throw new Error('Worker file already exists');

    const data = {
      upperCamelCaseWorkerName,
      workerNameFilePath,
      workerFileExPath,
      workerNameWorkerRelativePath,
      workerNameEnum,
      standalone,
    };

    const result = template(path.resolve(__dirname, '../../../template/worker/Worker.ts.art'), data);
    const workerFile = this.fileTree.newFile(workerFileExPath) as ScriptFileNode;
    workerFile.setContent(Buffer.from(result));

    const workerNameFileExtPath = workerNameFilePath + '.ts';
    const workerNameFile = this.fileTree.getFile(workerNameFileExtPath) as ScriptFileNode;
    await workerNameFile.load();
    const workerNameFileAST = new CodeInserter(workerNameFile);
    workerNameFileAST.insertEnum(workerNameEnum, upperCamelCaseWorkerName, Utility.dashlize(upperCamelCaseWorkerName));

    const workerRegisterFileExtPath = workerRegisterFilePath + '.ts';
    const workerRegisterFile = this.fileTree.getFile(workerRegisterFileExtPath) as ScriptFileNode;
    const workerRegisterServiceRelativePath = Utility.resolveImportPath(workerRegisterFilePath, workerFilePath) + '.js';
    await workerRegisterFile.load();
    const workerRegisterAST = new CodeInserter(workerRegisterFile);
    workerRegisterAST.addImport(upperCamelCaseWorkerFullName, workerRegisterServiceRelativePath, false);
    workerRegisterAST.insertCodeInClassMethod(workerRegisterClass, workerRegisterMethod, `\n    ${upperCamelCaseWorkerFullName}.register();`);

    this.log(`Worker ${upperCamelCaseWorkerFullName} generated`);

    if (!flags['dry-run']) {
      await this.fileTree.commit();
    } else {
      this.log('Dry run - no files written');
    }
  }
}
