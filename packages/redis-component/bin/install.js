export async function prepare(ctx) {
  return [
    {
      type: 'input',
      name: 'componentName',
      message: 'Component name (e.g., business-redis)',
      default: 'redis',
    },
  ];
}

export async function action(answers, ctx, helpers) {
  const {componentName} = answers;
  const enumKey = helpers.camelize(componentName, true);
  const fieldName = helpers.camelize(componentName, false);
  const packageName = ctx.packageName;

  await helpers.addComponentToCom({
    importStatement: `import {RedisComponent} from '${packageName}'`,
    enumKey,
    enumValue: componentName,
    staticFieldName: fieldName,
    staticFieldExpression: `new RedisComponent()`,
    registerCall: `Runtime.registerComponent(ComponentName.${enumKey}, this.${fieldName})`,
  });

  const varPrefix = fieldName;
  await helpers.appendToConfigTemplate({
    defines: [
      { name: `${varPrefix}Url`, type: 'string', hint: `${componentName} URL` },
      { name: `${varPrefix}Database`, type: 'number', hint: `${componentName} database index` },
    ],
    content: {
      components: {
        [componentName]: {
          url: `$(${varPrefix}Url)`,
          database: `$(${varPrefix}Database)`,
        },
      },
    },
  });
}
