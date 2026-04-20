import {flags} from '@oclif/command';
import path = require('path');

import {BaseCommand} from '../../Base';
import {Collector} from '../../lib/exporter/Collector';
import {Emitter} from '../../lib/exporter/Emitter';
import {ProgramBuilder} from '../../lib/exporter/ProgramBuilder';
import {Transformer} from '../../lib/exporter/Transformer';
import {TypeResolver} from '../../lib/exporter/TypeResolver';

export default class ExportApi extends BaseCommand {
  static description = 'Export API type declarations';

  static flags = {
    ...BaseCommand.flags,
    target: flags.string({
      multiple: true,
      description: 'Target modes for export (e.g., web, admin)',
    }),
  };

  async run() {
    const {flags: parsedFlags} = this.parse(ExportApi);
    const targets = parsedFlags.target;

    await this.loadConfig();
    this.log('Scanning source files...');

    const rootDir = this.soraConfig.soraRoot;
    const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');

    const builder = new ProgramBuilder(rootDir, tsconfigPath);
    const program = builder.build();

    this.log('Collecting export targets...');

    const collector = new Collector();
    const fullPlan = collector.collect(program);

    const transformer = new Transformer();

    const fullFiltered = collector.filterByTarget(fullPlan, undefined);
    const fullDecls = transformer.transform(program, fullFiltered.routes, fullFiltered.entities, fullFiltered.simple, undefined);
    const fullResolver = new TypeResolver();
    const fullTypeDeps = fullResolver.resolve(program, fullDecls);

    const outputPath = this.soraConfig.sora.apiDeclarationOutput;
    const absoluteOutputPath = path.resolve(this.soraConfig.soraRoot, outputPath);

    const emitter = new Emitter(absoluteOutputPath);
    emitter.emitFile(fullDecls, [], fullTypeDeps);

    this.log(`Found ${fullFiltered.routes.length} routes, ${fullFiltered.entities.length} entities, ${fullFiltered.simple.length} simple exports`);

    // Per-target exports
    if (targets && targets.length > 0) {
      for (const target of targets) {
        const targetFiltered = collector.filterByTarget(fullPlan, [target]);
        const targetDecls = transformer.transform(program, targetFiltered.routes, targetFiltered.entities, targetFiltered.simple, [target]);
        const targetResolver = new TypeResolver();
        const targetTypeDeps = targetResolver.resolve(program, targetDecls);

        const targetEmitter = new Emitter(absoluteOutputPath);
        targetEmitter.emitFile(targetDecls, [], targetTypeDeps, target);

        this.log(`Generated target: ${target}`);
      }
    }

    this.log('Export complete!');
  }
}
