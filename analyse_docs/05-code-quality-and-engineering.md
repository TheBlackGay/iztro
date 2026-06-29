# iztro 代码工程质量分析

## 概述

代码工程质量的评估涵盖测试策略、持续集成、代码规范、构建流程、版本管理、文档生态等多个维度。本章对 iztro 的工程质量进行全面评估，分析其优势与可改进之处。

---

## 1. 测试架构分析

### 1.1 测试概览

iztro 使用 **Jest v29 + ts-jest** 作为测试框架，共包含 7 个测试文件，约 3,180 行测试代码：

| 测试文件 | 行数 | 测试领域 |
|---------|------|---------|
| `astro/astro.test.ts` | 1,153 | 排盘 API、运限、闰月处理、多语言、配置 |
| `star/location.test.ts` | 908 | 星曜定位算法（全部 14 辅星 + 杂耀） |
| `star/star.test.ts` | 478 | 星盘计算（主星、辅星、神煞、流耀） |
| `astro/analyzer.test.ts` | 290 | 宫位分析 API（has、notHave、fliesTo 等） |
| `astro/palace.test.ts` | 143 | 命宫身宫、五行局、大限 |
| `utils/index.test.ts` | 115 | 工具函数 |
| `astro/plugin.test.ts` | 93 | 插件系统 |

### 1.2 测试层次分布

```
                    E2E / 集成测试
       ┌──────────────────────────────────────┐
       │  astro/astro.test.ts   (1,153 行)    │ ← 全流程排盘测试
       │  astro/analyzer.test.ts  (290 行)    │ ← API 功能测试
       ├──────────────────────────────────────┤
       │         单元测试                      │
       │  star/location.test.ts   (908 行)    │ ← 星曜定位算法
       │  star/star.test.ts       (478 行)    │ ← 星盘组装
       │  astro/palace.test.ts    (143 行)    │ ← 宫位算法
       │  utils/index.test.ts     (115 行)    │ ← 工具函数
       │  astro/plugin.test.ts     (93 行)    │ ← 插件系统
       └──────────────────────────────────────┘
```

从测试比例来看，集成测试（astro 层）占约 45%，单元测试（star/utils 层）占约 55%，分布较为均衡。

### 1.3 测试模式分析

**数据驱动测试（Data-driven Testing）：**

iztro 大量使用 `data.forEach()` 进行参数化测试，这是最突出的测试模式：

```typescript
// star/location.test.ts 中的典型模式
const testData = [
  { yin: 'ziEarthly', yang: 'ziEarthly', expected: 2 },
  { yin: 'chouEarthly', yang: 'chouEarthly', expected: 6 },
  // ...大量测试数据
]

testData.forEach(({ yin, yang, expected }) => {
  test(`getStartIndex ${yin} ${yang}`, () => {
    setLanguage('zh-CN')
    const result = getStartIndex(
      // ...
    )
    expect(result.ziweiIndex).toBe(expected)
  })
})
```

**优势：**
- 测试全面性高，一组测试数据覆盖大量组合
- 新增测试用例只需扩展数据数组
- 测试命名与数据分离，可读性好

**回归测试（Regression Testing）：**

测试中明确引用了 GitHub Issue 编号：

```typescript
// GitHub Issue #242
test('GitHub Issue #242', () => { ... })

// GitHub Issue #244
test('GitHub Issue #244', () => { ... })

// GitHub Issue #269
test('GitHub Issue #269', () => { ... })
```

这是良好的工程实践——每个 bug 修复附带对应的回归测试，防止问题再次出现。

### 1.4 测试范围评估

**已覆盖的领域：**

| 领域 | 覆盖程度 | 代表测试 |
|------|---------|---------|
| 核心排盘 API | ✓✓✓ | `bySolar`、`byLunar`、`withOptions` 全部入口 |
| 14 主星定位 | ✓✓✓ | 所有主星的亮度、四化检测 |
| 14 辅星定位 | ✓✓✓ | 所有辅星的计算函数 |
| 37 杂耀定位 | ✓✓ | 部分有测试 |
| 48 神煞 | ✓✓ | 长生/博士/岁前将前 |
| 大限/小限 | ✓✓✓ | 起运年龄、顺逆方向 |
| 流年/流月/流日/流时 | ✓✓ | 基本功能 |
| 四化分析 | ✓✓✓ | hasMutagen、fliesTo、selfMutaged |
| 三方四正 | ✓✓✓ | surroundedPalaces |
| 插件系统 | ✓✓ | loadPlugin、loadPlugins |
| 配置系统 | ✓✓ | algorithm、yearDivide、dayDivide |
| 闰月处理 | ✓✓ | 前半月后半月 |
| 中州派算法 | ✓✓ | 三盘、命主差异 |
| 多语言输出 | ✓✓ | ko-KR、vi-VN |
| 边界日期 | ✓✓ | 晚子时、跨年 |

**未充分覆盖的领域：**

| 领域 | 覆盖程度 | 风险评估 |
|------|---------|---------|
| 异常输入 | ✗ | 无 null/undefined 测试，无格式错误输入测试 |
| en-US 语言 | ✗ | 仅 2 个断言 |
| zh-TW 语言 | ✗ | 完全未测试 |
| ja-JP 语言 | ✗ | 完全未测试 |
| 性能测试 | ✗ | 无基准测试 |
| 浏览器兼容 | ✗ | 无 E2E/集成测试 |
| 依赖 mock | ✗ | 所有测试使用真实依赖 |

### 1.5 测试隔离分析

iztro 的测试采用了全局状态的修改模式，但通过 `afterEach` 进行清理：

```typescript
describe('bySolar', () => {
  afterEach(() => {
    setLanguage('zh-CN')   // 重置语言
    astro.config({})       // 重置配置
  })

  test('...', () => {
    setLanguage('ko-KR')   // 修改全局状态
    // ... 测试
  })
  // afterEach 自动清理
})
```

这种模式在小型测试中可用，但在大规模并发测试中可能产生竞态条件。对于 iztro 的单线程 Jest 串行执行场景，这不是问题。

---

## 2. 持续集成与部署

### 2.1 CI/CD 管线架构

iztro 有三条独立的 GitHub Actions 工作流：

```
GitHub Actions
├── Codecov.yaml     ← Push/PR to main
│   ├── checkout
│   ├── setup Node 18
│   ├── npm install
│   ├── npm test (jest --coverage)
│   └── upload to Codecov
│
├── Document.yml     ← Push to default-branch + manual
│   ├── checkout
│   ├── configure Pages
│   ├── upload docs/ as artifact
│   └── deploy to Pages
│
└── Release.yaml     ← GitHub Release created
    ├── checkout
    ├── setup Node 18
    ├── npm install
    ├── npm run build:umd (webpack)
    ├── tar dist/
    └── upload to Release
```

### 2.2 NPM 生命周期钩子

```
preversion → lint
version    → format + git add -A src
postversion → git push + git push --tags
prepublishOnly → test + lint + build:umd
prepare    → build (tsc)
```

**发布流程：**
```
git commit → npm version patch
  → auto: lint
  → auto: format + git add
  → auto: git push + tags

npm publish
  → auto: test + lint + webpack build
  → publish to npm
```

### 2.3 CI/CD 评估

| 维度 | 评估 | 说明 |
|------|------|------|
| 测试自动化 | ✓ | push/PR 自动运行 |
| 覆盖率追踪 | ✓ | Codecov 集成 |
| 多 Node 版本 | ✗ | 仅 Node 18 |
| 操作系统矩阵 | ✗ | 仅 ubuntu-latest |
| lint 检查 | ○ | prepublishOnly 触发，非 CI |
| 构建验证 | ✓ | UMD 构建验证 |
| 文档部署 | ✓ | GitHub Pages |
| Release 自动化 | ✓ | 创建 Release 自动构建 |
| 依赖缓存 | ✗ | 未配置缓存加速 |

---

## 3. 代码规范与静态分析

### 3.1 TypeScript 配置

```json
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "strict": true,
    "declaration": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "outDir": "./lib"
  }
}
```

**关键配置评估：**

| 配置 | 启用 | 意义 |
|------|------|------|
| `strict: true` | ✓ | 启用全部严格模式检查 |
| `declaration: true` | ✓ | 生成 `.d.ts` 类型文件 |
| `target: "es5"` | ✓ | 最大兼容性（降至 ES5） |
| `sourceMap` | ✗ | 未启用，调试不便 |
| `noUnusedLocals` | ✗ | 未启用，可能有未使用变量 |
| `noUnusedParameters` | ✗ | 未启用 |

### 3.2 ESLint 配置

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {}
}
```

**评估：** ESLint 使用推荐配置，未添加自定义规则。这在小型项目中是可接受的做法，但缺少一些对代码质量有实质帮助的规则，如 `no-console`、`max-lines`、`complexity` 等。

### 3.3 Prettier 配置

```json
{
  "printWidth": 120,
  "trailingComma": "all",
  "singleQuote": true
}
```

120 字符的宽度在紫微斗数代码中是合理的——星曜名称和算法表达式往往较长，较宽的宽度减少了换行频率。

---

## 4. 构建与打包分析

### 4.1 构建产出

| 格式 | 入口 | 构建工具 | 兼容目标 |
|------|------|---------|---------|
| CommonJS | `lib/index.js` | tsc | Node.js |
| TypeScript 类型 | `lib/index.d.ts` | tsc | TypeScript |
| UMD | `dist/iztro.min.js` | Webpack + Babel | 浏览器 (ie >= 11) |

### 4.2 依赖体积分析

| 依赖 | 预计体积 | 打包策略 | 影响 |
|------|---------|---------|------|
| `dayjs` | ~5KB | 全量引入 | 中等 |
| `i18next` | ~30KB | 全量引入（含全部6种语言资源） | 较大 |
| `lunar-lite` | ~10KB | 全量引入 | 中等 |
| `lunar-typescript` | ~50KB | 全量引入 | 较大 |

**Tree-shaking 分析：**
- CJS 输出不支持 tree-shaking（CommonJS 模块是动态的）
- UMD 输出已 minify 但未做 tree-shaking
- 如果消费者使用 ESM 构建工具（webpack/rollup），CJS 格式也无法受益于 tree-shaking

### 4.3 多语言加载策略

iztro 将全部 6 种语言的翻译数据**一次性地**打包到 `i18next.init()` 中：

```typescript
i18next.init({
  lng: 'zh-CN',
  resources: {
    'en-US': { translation: transEnUS },
    'ja-JP': { translation: transJaJP },
    'ko-KR': { translation: transKoKR },
    'zh-CN': { translation: transZhCN },
    'zh-TW': { translation: transZhTW },
    'vi-VN': { translation: transViVN },
  },
})
```

这意味着用户即使只需要一种语言，所有 6 种语言的翻译数据都会被加载。这是一个**按需加载**的可优化点。

---

## 5. 版本管理与发布

### 5.1 版本历史模式

从 CHANGELOG 的版本历史可观察到以下模式：

```
v2.5.x 系列（最新）:
  v2.5.8 - 修复 晚子时人盘错误
  v2.5.7 - 修复 天使重复、十二长生排序
  v2.5.6 - 修复 天使/天伤/天才计算
  v2.5.5 - 更改默认月份分界（初一）
  v2.5.4 - 更改默认日期分界（除夕）、中州派命主算法
  v2.5.3 - 修复三盘显示
  v2.5.2 - 修复闰月流日流月、晚子时配置
  v2.5.1 - ...
```

**发布频率：** v2.5.x 系列平均约 1-2 周一个 patch 版本，以 bug 修复为主，偶尔有功能增强。发布节奏活跃，反映了持续维护的状态。

### 5.2 CHANGELOG 风格

CHANGELOG 使用 emoji 标签分类：
- `:hammer:` 修复 — bug 修复
- `:sparkles:` 改进 — 功能增强
- `:wand:` 功能 — 新功能
- `:broom:` 琐事 — 维护工作

每个条目包含中文描述和 GitHub Issue 引用，便于追溯。

### 5.3 语义化版本实践

| 阶段 | 命令 | 自动操作 |
|------|------|---------|
| 版本提升 | `npm version patch/minor/major` | lint → 格式化 → git add → git push + tags |
| 发布 | `npm publish` | test + lint + build:umd → 发布 |
| Release | 创建 GitHub Release | 自动构建 UMD → 上传到 Release |

---

## 6. 依赖管理

### 6.1 生产依赖

| 依赖 | 版本 | 用途 | 替代方案评估 |
|------|------|------|------------|
| `dayjs` | ^1.11.10 | 日期操作 | 可用原生 Date，但 dayjs 提供更好的 API |
| `i18next` | ^23.5.1 | 国际化 | 体积较大（30KB+），可考虑自实现轻量方案 |
| `lunar-lite` | ^0.2.8 | 农历转换 | 核心依赖，不可替代 |
| `lunar-typescript` | ^1.7.8 | 农历补充 | 与 `lunar-lite` 功能重叠 |

**依赖冗余分析：** `lunar-typescript` 和 `lunar-lite` 都来自同一作者（SylarLong），但前者是后者的 TypeScript 重写版。iztro 主要使用 `lunar-lite`，`lunar-typescript` 可能用于部分 TypeScript 特定功能。理论上可以统一为一个依赖以减小体积。

### 6.2 锁定文件

使用 `yarn.lock` 锁定依赖版本，确保可复现的构建。

---

## 7. 文档生态

### 7.1 文档体系

| 文档类型 | 位置 | 格式 | 内容 |
|---------|------|------|------|
| 项目介绍 | `README.md` | Markdown | 功能列表、安装、快速示例 |
| 英文文档 | `README-en_US.md` | Markdown | 英文版介绍 |
| 繁中文档 | `README-zh_TW.md` | Markdown | 繁体中文版 |
| API 文档 | `docs/posts/` | VitePress | Astrolabe、Palace、Star、Horoscope API |
| 学习教程 | `docs/learn/` | VitePress | 紫微斗数基础、14 主星、辅星、杂耀、四化等 |
| 古籍资料 | `docs/learn/ancientBook*.html` | VitePress | 紫微斗数全书原文 |
| 贡献指南 | `CONTRIBUTING.md` | Markdown | 如何贡献 |
| 行为准则 | `CODE_OF_CONDUCT.md` | Markdown | 社区规范 |
| 安全政策 | `SECURITY.md` | Markdown | 漏洞报告 |
| 更新日志 | `CHANGELOG.md` | Markdown | 版本变更记录 |

### 7.2 文档架构评估

| 维度 | 评估 | 说明 |
|------|------|------|
| API 参考完整性 | ✓✓✓ | 所有公共 API 均有文档 + 示例代码 |
| 入门指南 | ✓✓ | 支持 3 种语言的快速开始 |
| 学习资料 | ✓✓✓ | 14 篇紫微斗数知识文档 |
| 古籍引用 | ✓✓ | 3 篇古籍文献 |
| 类型定义文档 | ✓✓ | 有独立的 type-definition 页面 |
| 多语言文档 | ✓✓ | 3 种语言 |
| 搜索功能 | ✓ | VitePress 内置搜索 + Google Analytics |

### 7.3 代码注释风格

iztro 的代码注释采用 JSDoc 风格，以中文编写：

```typescript
/**
 * 五虎遁 从年干算月干。
 *
 * "五虎遁元"年上起月法，简称 `五虎遁`。
 * 因为正月建寅，所以正月的地支为寅，寅属虎，所以叫五虎盾。
 *
 * - 甲己之年丙作首
 * - 乙庚之岁戊为头
 * - ...
 */
export const TIGER_RULE = { ... }
```

**注释覆盖情况：**
- 数据层：完整，每个常量和数据结构都有中文注释
- 算法层：部分关键算法有注释
- 函数层：部分公共函数有 JSDoc，内部函数较少

---

## 8. 安全分析

### 8.1 依赖安全

iztro 的依赖中不存在已知的高危漏洞（截至项目版本）。`yarn.lock` 确保了依赖版本的确定性。

### 8.2 输入安全

iztro 的输入处理：
- 日期字符串通过 `dayjs` 解析，自带格式校验
- 多语言字符串通过 `kot()` 验证，无效输入返回原值
- 不存在 SQL 注入或命令注入风险（纯计算库）

### 8.3 发布安全

- `prepublishOnly` 钩子执行 test + lint + build，确保发布质量
- 使用 `files` 字段限制发布内容（仅 `lib/` 和 `dist/`）
- npm 包未包含 `.env` 或敏感文件

---

## 9. 可维护性评估

### 9.1 代码指标

| 指标 | 评估 | 说明 |
|------|------|------|
| 代码行数 | ~5,000 行 (src) | 适度规模 |
| 函数数量 | ~100+ | 适度 |
| 循环复杂度 | 适中 | 主要算法有多个分支但可读性良好 |
| 重复代码 | 低 | DRY 原则执行良好 |
| 命名一致性 | 高 | camelCase 一致性、命名含义清晰 |

### 9.2 模块耦合度

模块间的依赖关系（前面提到的单向依赖原则）：
```
utils  → （无依赖 data）
data   → （无依赖 utils）
star   → utils, data
astro  → star, utils, data
i18n   → （独立，被所有模块依赖）
```

这是一个清晰的层级结构，不存在循环依赖。

### 9.3 遗留问题

1. **`SECURITY.md` 仓库名错误**：`SylarLong/astro` 应为 `SylarLong/iztro`
2. **`lunar-typescript` 与 `lunar-lite` 重叠**：可考虑合并以减小体积
3. **`kot()` 的 O(n) 查找**：高频调用场景可预构建索引
4. **测试覆盖率盲区**：en-US/zh-TW/ja-JP 的 i18n 测试缺失

---

## 10. 综合评价

| 维度 | 得分 | 说明 |
|------|------|------|
| 测试覆盖 | ⭐⭐⭐⭐☆ | 核心功能覆盖好，缺异常测试和部分语言测试 |
| CI/CD | ⭐⭐⭐⭐☆ | 自动化程度高，缺少缓存和多平台 |
| 代码规范 | ⭐⭐⭐⭐⭐ | strict TS + ESLint + Prettier 全线覆盖 |
| 构建系统 | ⭐⭐⭐⭐☆ | 多格式输出，ie11 兼容，缺 ESM |
| 依赖管理 | ⭐⭐⭐⭐☆ | 依赖选择合理，存在小量可优化 |
| 文档 | ⭐⭐⭐⭐⭐ | API/学习/古籍均有，3 种语言 |
| 安全 | ⭐⭐⭐⭐☆ | 风险低，无高危依赖 |
| 可维护性 | ⭐⭐⭐⭐☆ | 架构清晰，有少量遗留问题 |

iztro 的代码工程质量在同类型开源项目中处于中上水平。其最大的优势在于 **类型安全、依赖结构清晰、文档完整**。主要的改进空间在于测试的广度和构建的体积优化。
