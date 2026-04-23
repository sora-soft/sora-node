export async function prepare(ctx) {
  return [
    {
      type: 'input',
      name: 'componentName',
      message: 'Component name (e.g., etcd)',
      default: 'etcd',
    },
  ];
}

export async function action(answers, ctx, helpers) {
  const {componentName} = answers;
  const enumKey = helpers.camelize(componentName, true);
  const fieldName = helpers.camelize(componentName, false);
  const packageName = ctx.packageName;

  await helpers.addComponentToCom({
    importStatement: `import {EtcdComponent} from '${packageName}'`,
    enumKey,
    enumValue: componentName,
    staticFieldName: fieldName,
    staticFieldExpression: `new EtcdComponent()`,
    registerCall: `Runtime.registerComponent(ComponentName.${enumKey}, this.${fieldName})`,
  });

  const varPrefix = fieldName;
  await helpers.appendToConfigTemplate({
    defines: [
      { name: `${varPrefix}Host`, type: 'string', hint: `${componentName} host` },
    ],
    content: {
      components: {
        [componentName]: {
          etcd: {
            hosts: [`$(${varPrefix}Host)`],
          },
          ttl: 60,
          prefix: '$(projectScope)',
        },
      },
    },
  });
}
