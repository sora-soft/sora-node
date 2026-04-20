import {Command, flags} from '@oclif/command';
import inquirer = require('inquirer');
import ora = require('ora');
import chalk from 'chalk';
import path = require('path');
import git = require('isomorphic-git');
import http = require('isomorphic-git/http/node');
import fs = require('fs/promises');
import oFS = require('fs');
import pathModule = require('path');

export default class NewProject extends Command {
  static description = 'Create a new sora project';

  static args = [
    {name: 'name', required: true, description: 'Project name'},
  ];

  static flags = {
    help: flags.help({char: 'h'}),
  };

  async run() {
    const {args} = this.parse(NewProject);
    const name = args.name as string;

    const stat = await fs.stat(name).catch(err => {
      if (err.code === 'ENOENT')
        return null;
      throw err;
    });
    if (stat) {
      this.log(chalk.red(`${name} already exists!`));
      return;
    }

    const options = await inquirer
      .prompt([
        {
          name: 'projectName',
          message: 'Project name?',
          default: name,
        },
        {
          name: 'description',
          message: 'Description?',
        },
        {
          name: 'version',
          message: 'Version?',
          default: '1.0.0',
        },
        {
          name: 'author',
          message: 'Author?',
        },
        {
          name: 'license',
          message: 'License?',
          default: 'MIT',
        },
        {
          name: 'confirm',
          message: 'OK?',
          default: true,
          type: 'confirm',
        },
      ]);

    if (!options.confirm) {
      return;
    }

    const loading = ora('Downloading').start();
    const dir = path.join(process.cwd(), name);
    await git.clone({
      fs: oFS,
      http,
      dir,
      url: 'https://github.com/sora-soft/backend-example-project.git',
      singleBranch: true,
      remote: 'upstream',
      depth: 1,
    });

    loading.stop();

    const pkgPath = pathModule.resolve(process.cwd(), name, 'package.json');
    const installedPkg = await import(pkgPath);

    installedPkg.name = options.projectName;
    installedPkg.description = options.description;
    installedPkg.version = options.version;
    installedPkg.author = options.author;
    installedPkg.license = options.license;

    delete installedPkg.repository;
    delete installedPkg.bugs;
    delete installedPkg.homepage;
    delete installedPkg.scripts.test;
    delete installedPkg.scripts.link;

    await fs.writeFile(pkgPath, JSON.stringify(installedPkg, null, 2));

    this.log(chalk.green('Project generated successfully'));
  }
}
