## 1. 实现 define-transform

- [x] 1.1 创建 `scripts/define-transform/package.json`（name: "define-transform"）
- [x] 1.2 实现 `scripts/define-transform/index.js`：导出 `(program, options) => ts.TransformerFactory`，解析 `defines` 配置，支持 `pkg`/`env`/`literal` 三种来源，支持 string 简写语法，支持 `packagePath` 选项
- [x] 1.3 实现值到 AST 节点的类型映射：string → StringLiteral, number → NumericLiteral, boolean → TrueKeyword/FalseKeyword, null → NullKeyword
- [x] 1.4 实现安全检查：跳过 PropertyAssignment/PropertyDeclaration 的 name 位置、PropertyAccessExpression 的 name、QualifiedName 的 right

## 2. 迁移 tsconfig 配置

- [x] 2.1 更新 `tsconfig.base.json`：将 `{ "transform": "../../scripts/version-transform", "identifier": "__VERSION__" }` 替换为 `{ "transform": "../../scripts/define-transform", "defines": { "__VERSION__": { "pkg": "version" } } }`
- [x] 2.2 更新 `packages/ram-discovery/tsconfig.json`：同上格式迁移
- [x] 2.3 更新 `packages/http-support/tsconfig.json`：同上格式迁移
- [x] 2.4 更新 `packages/etcd-discovery/tsconfig.json`：同上格式迁移

## 3. 清理和更新 spec

- [x] 3.1 删除 `scripts/version-transform/` 目录
- [x] 3.2 创建 `openspec/specs/define-transform/spec.md`（从 change specs 中的内容复制为正式 spec）
- [x] 3.3 更新 `openspec/specs/version-transform/spec.md`：标记所有需求为 REMOVED

## 4. 验证

- [x] 4.1 对 `packages/framework` 执行编译，验证 `__VERSION__` 被正确替换为 package.json 中的版本字符串
- [x] 4.2 验证属性访问（如 `obj.__VERSION__`）不被替换
