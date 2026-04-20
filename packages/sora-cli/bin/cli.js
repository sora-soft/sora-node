#!/usr/bin/env node

const {run} = require('@oclif/command')
run()
  .then(() => require('@oclif/command/flush'))
  .catch(require('@oclif/errors/handle'))
