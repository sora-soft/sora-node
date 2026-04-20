import {flags} from '@oclif/command';
import path = require('path');

import {BaseCommand} from '../../base';
import {Collector} from '../../lib/exporter/collector';
import {Emitter} from '../../lib/exporter/emitter';
import {ProgramBuilder} from '../../lib/exporter/program-builder';
import {Transformer} from '../../lib/exporter/transformer';
import {TypeResolver} from '../../lib/exporter/type-resolver';

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

    const allEnumDecls = fullPlan.enums.map(enumInfo => {
      return transformer.transformEnum(program, enumInfo.enumName, enumInfo.filePath);
    }).filter((d): d is NonNullable<typeof d> => d !== null);

    const fullFiltered = collector.filterByTarget(fullPlan, undefined);
    const fullDecls = transformer.transform(program, fullFiltered.routes, fullFiltered.entities, fullFiltered.generics, undefined);
    const fullResolver = new TypeResolver();
    const fullTypeDeps = fullResolver.resolve(program, [...fullDecls, ...allEnumDecls]);

    const outputPath = this.soraConfig.sora.apiDeclarationOutput;
    const absoluteOutputPath = path.resolve(this.soraConfig.soraRoot, outputPath);

    const emitter = new Emitter(absoluteOutputPath);
    emitter.emitFile(fullDecls, allEnumDecls, fullTypeDeps);

    this.log(`Found ${fullFiltered.routes.length} routes, ${fullFiltered.entities.length} entities, ${fullFiltered.generics.length} generics, ${fullFiltered.enums.length} enums`);

    // Per-target exports
    if (targets && targets.length > 0) {
      for (const target of targets) {
        const targetFiltered = collector.filterByTarget(fullPlan, [target]);
        const targetDecls = transformer.transform(program, targetFiltered.routes, targetFiltered.entities, targetFiltered.generics, [target]);
        const targetResolver = new TypeResolver();
        const targetTypeDeps = targetResolver.resolve(program, [...targetDecls, ...allEnumDecls]);

        const targetEmitter = new Emitter(absoluteOutputPath);
        targetEmitter.emitFile(targetDecls, allEnumDecls, targetTypeDeps, target);

        this.log(`Generated target: ${target}`);
      }
    }

    this.log('Export complete!');
  }
}
