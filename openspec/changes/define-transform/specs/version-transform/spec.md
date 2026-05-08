## 移除需求

### 需求:version-transform 必须在编译时替换 __VERSION__ 标识符
**Reason**: version-transform 整体被 define-transform 替代，编译时常量注入功能由 define-transform 的 `defines` 配置涵盖。
**Migration**: 在 tsconfig plugins 中将 `{ "transform": ".../version-transform", "identifier": "__VERSION__" }` 替换为 `{ "transform": ".../define-transform", "defines": { "__VERSION__": { "pkg": "version" } } }`

### 需求:version-transform 必须从 package.json 读取版本号
**Reason**: 由 define-transform 的 `pkg` 来源覆盖。
**Migration**: 使用 `{ "pkg": "version" }` 来源配置。

### 需求:version-transform 必须通过 tsconfig plugin option 支持自定义标识符名称
**Reason**: define-transform 通过 `defines` 对象的键名直接指定标识符名称，不再需要单独的 `identifier` 选项。
**Migration**: 将 `identifier` 的值作为 `defines` 的键名。

### 需求:version-transform 必须导出标准 ts.TransformerFactory
**Reason**: define-transform 导出相同签名，此需求由 define-transform 的对应需求覆盖。
**Migration**: 更新 transform 路径指向 `scripts/define-transform`。
