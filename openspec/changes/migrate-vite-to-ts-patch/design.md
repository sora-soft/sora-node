## Context

sora-node 是一个 TypeScript monorepo，包含 9 个 packages 和 3 个 apps。当前构建管线使用 Vite 7 作为打包器，配合以下插件：

- `vite-plugin-swc-transform`：装饰器转译（SWC）
- `vite-plugin-dts`：.d.ts 类型声明生成
- `@typia/unplugin/vite`：typia AOT 类型验证转换
- `@sora-soft/typia-decorator/unplugin/vite`：`@guard` 装饰器转换
- Vite `define`：`__VERSION__` 编译时常量注入

但 tsc + ts-patch 可以原生完成上述所有职责，无需引入 Vite 及其插件生态。`sora-cli` 和 `typia-decorator` 两个包从未使用 Vite，一直用纯 tsc 编译，验证了这条路径的可行性。

## Goals / Non-Goals

**Goals：**
- 将所有 10 个包的构建从 `vite build` 迁移到 `tsc`（通过 ts-patch 支持 transformer 插件）
- 移除所有 Vite 相关依赖（vite、vite-plugin-dts、vite-plugin-swc-transform、@swc/core）
- 移除 `@typia/unplugin`，改用 typia 的 tsc 原生 transformer `@typia/transform`
- 从 typia-decorator 中移除 unplugin 入口，只保留 tsc transformer
- 用自写 ts-patch transformer 替代 Vite `define` 的 `__VERSION__` 注入
- 移除 vitest，测试框架替代方案后续单独处理

**Non-Goals：**
- 不处理测试框架迁移（46 个测试文件暂时挂起）
- 不改变任何运行时行为或公共 API
- 不改变包的 exports 路径结构
- 不处理 typia-decorator 的 peerDependencies 清理（unplugin 相关的 peerDeps 留待后续）

## Decisions

### Decision 1: ts-patch 而非 ttypescript

**选择**：ts-patch（最新 3.3.0）

**理由**：
- typia 官方推荐 ts-patch（文档中明确写 `npm install --save-dev ts-patch`）
- ts-patch 直接修补 `tsc` 二进制，用户继续使用 `tsc` 命令，无需记住 `ttsc`
- ttypescript 已长时间不维护

**替代方案**：ttypescript — 项目已停更，不推荐

### Decision 2: 自写 version-transform 而非 ts-transform-define

**选择**：在 `scripts/version-transform/` 下自写一个 ~30 行的 ts-patch transformer

**理由**：
- `ts-transform-define` 最后更新于 2020 年，依赖 typescript ^3.7.0，与项目 TS 5.9.3 不兼容
- 功能极其简单：遍历 AST，将 `__VERSION__` Identifier 替换为 StringLiteral
- 与 typia、typia-decorator 共享同一 ts-patch 插件管道，无额外工具链
- 可读取 tsconfig plugin options 中的 `identifier` 和 `sourceFile` 配置

**替代方案**：
- 构建脚本生成 `version.ts` — 需要改所有消费方的 import 模式，侵入性太大
- `process.env` 注入 — 运行时而非编译时

### Decision 3: typia 注册方式

**选择**：在 `tsconfig.base.json` 的 `plugins` 数组中统一注册

```json
{
  "compilerOptions": {
    "plugins": [
      { "transform": "typia/lib/transform" },
      { "transform": "@sora-soft/typia-decorator/transform" },
      { "transform": "../../scripts/version-transform", "identifier": "__VERSION__" }
    ]
  }
}
```

**理由**：
- typia 官方文档的 tsconfig 注册方式就是 `{ "transform": "typia/lib/transform" }`
- `@sora-soft/typia-decorator/transform` 已经导出标准 `ts.TransformerFactory<ts.SourceFile>`
- version-transform 使用相对路径，支持通过 plugin option 配置标识符名称
- 所有子包通过 `extends` 继承 `tsconfig.base.json`，统一注册一处即可

**注意**：某些包不需要 typia（如 `ram-discovery`），不需要 typia-decorator（如 `etcd-discovery`、`http-support`），不需要 version（如 `typia-decorator` 自身）。这些包在各自的 `tsconfig.json` 中覆盖 `plugins` 为空数组或只保留需要的插件。

### Decision 4: 装饰器处理

**选择**：完全由 tsc 原生处理

**理由**：
- `tsconfig.base.json` 已配置 `experimentalDecorators: true` 和 `emitDecoratorMetadata: true`
- tsc 原生支持 `emitDecoratorMetadata`（生成 `__decorate([__metadata("design:type", ...)]`），SWC 也只是模拟这一行为
- 不再需要 `vite-plugin-swc-transform` 和 `@swc/core`

### Decision 5: .d.ts 生成

**选择**：tsc 原生 `declaration: true`

**理由**：
- `tsconfig.base.json` 已配置 `declaration: true` 和 `declarationMap: true`
- `vite-plugin-dts` 本质上也是调用 tsc 生成声明文件，只是多了一层包装
- tsc 原生生成的 .d.ts 更准确（直接基于编译器的类型信息）

### Decision 6: typia-decorator 的 unplugin 移除

**选择**：删除 `src/unplugin/` 目录及 `exports` 中的 `./unplugin/*` 路径

**理由**：
- 项目全面回归 ts-patch，不再有 bundler 层面的消费者
- `src/transform/` 的 tsc transformer 入口已完全覆盖功能
- 减少 peerDependencies 负担（unplugin、magic-string、@rollup/pluginutils 等）

## Risks / Trade-offs

**[风险] tsc 输出目录结构与 Vite 不同** → 缓解：经逐包确认，入口文件（如 `src/rxjs.ts`、`src/typeorm.ts`）在 `src/` 根级，tsc 输出到 `dist/rxjs.js`、`dist/typeorm.js`，与 exports 路径匹配。无破坏性变更。

**[风险] version-transform 可能替换非预期的 `__VERSION__` 标识符** → 缓解：transformer 仅替换顶级 `Identifier` 节点且名称精确匹配 `__VERSION__`，不会误替换属性访问（如 `obj.__VERSION__`）。且仅在声明了 `declare const __VERSION__: string` 的文件中生效。

**[风险] ts-patch 与 TypeScript 5.9 兼容性** → 缓解：ts-patch 3.3.0 支持 TypeScript 5.x 系列。typia 官方也使用 ts-patch + TS 5.x 组合。但每次 TS 大版本升级可能需要重新 `ts-patch install`。

**[权衡] 测试暂时不可用** → vitest 依赖 vite config，移除 vite 后 framework 包的 46 个测试文件暂时无法运行。这是已知的短期代价，后续单独处理测试框架迁移。

**[权衡] typia-decorator 的 unplugin 移除对外部消费者的影响** → 如果有外部项目通过 unplugin 使用 typia-decorator，升级后将失去 unplugin 支持。但 typia-decorator 是内部包（workspace:*），影响范围可控。

## Migration Plan

1. **先准备基础设施**：新增 ts-patch、编写 version-transform、更新 tsconfig.base.json
2. **再逐包迁移**：从无依赖叶子包开始（ram-discovery），逐步向依赖链上游迁移
3. **最后清理**：移除 vite.config.base.ts、删除所有 vite.config.ts、清理 package.json 依赖
4. **验证**：每个包迁移后运行 `tsc` 确认编译通过

**回滚策略**：git revert 即可，所有变更都是文件级别的增删改。

## Open Questions

- 无（探索阶段已充分澄清所有关键问题）
