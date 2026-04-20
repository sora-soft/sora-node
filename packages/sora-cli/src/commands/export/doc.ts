import {flags} from '@oclif/command';
import path = require('path');

import {BaseCommand} from '../../Base';
import {DocCollector} from '../../lib/doc/DocCollector';
import {DocTransformer} from '../../lib/doc/DocTransformer';
import {OpenApiEmitter} from '../../lib/doc/OpenApiEmitter';
import {ProgramBuilder} from '../../lib/exporter/ProgramBuilder';

export default class ExportDoc extends BaseCommand {
  static description = 'Export OpenAPI documentation from route classes';

  static flags = {
    ...BaseCommand.flags,
    format: flags.string({
      description: 'Output format: yaml or json',
      options: ['yaml', 'json'],
      default: 'yaml',
    }),
    target: flags.string({
      multiple: true,
      description: 'Target modes to include (e.g., web, admin)',
    }),
  };

  async run() {
    const {flags: parsedFlags} = this.parse(ExportDoc);
    const format = (parsedFlags.format || 'yaml') as 'yaml' | 'json';
    const targets = parsedFlags.target;

    await this.loadConfig();
    this.log('Scanning source files...');

    const rootDir = this.soraConfig.soraRoot;
    const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');

    const builder = new ProgramBuilder(rootDir, tsconfigPath);
    const program = builder.build();

    this.log('Collecting route classes...');

    const docCollector = new DocCollector();
    const fullPlan = docCollector.collect(program);
    const filteredPlan = docCollector.filterByTarget(fullPlan, targets);

    this.log(`Found ${filteredPlan.routes.length} route class(es)`);

    const transformer = new DocTransformer();
    const result = transformer.transform(program, filteredPlan.routes, targets);

    const docOutput = this.soraConfig.sora.docOutput;
    if (!docOutput) {
      this.error('docOutput is not configured in sora.json');
      return;
    }

    const absoluteOutputPath = path.resolve(this.soraConfig.soraRoot, docOutput);

    const emitter = new OpenApiEmitter(absoluteOutputPath, process.cwd());
    emitter.emit(result.pathItems, program, filteredPlan.routes, targets, format);

    const ext = format === 'yaml' ? '.yml' : '.json';
    this.log(`Exported OpenAPI documentation: ${absoluteOutputPath}${ext}`);
    this.log(`Total paths: ${result.pathItems.length}`);
  }
}
