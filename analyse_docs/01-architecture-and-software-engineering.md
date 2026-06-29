# iztro 项目架构与软件工程分析

## 概述

iztro v2.5.8 是一个由 TypeScript 编写的紫微斗数星盘生成开源库（MIT 协议），作者 SylarLong。它以 JavaScript/TypeScript 生态为运行环境，将中国传统紫微斗数的排盘算法系统地进行了软件工程化实现。本章将从软件工程的多个维度对其架构设计进行深入分析。

---

## 1. 整体架构：分层模块化设计

iztro 采用典型的分层架构，将系统划分为 5 个核心模块 + 1 个工具层 + 1 个数据层：

```
┌─────────────────────────────────────────────────────┐
│                    Public API                        │
│              astro / star / data / util              │
├──────────┬──────────┬──────────┬──────────┬─────────┤
│  astro/   │  star/   │  data/   │  i18n/   │ utils/  │
│  核心编排   │  星曜算法   │  数据常量   │  国际化   │  工具函数  │
├──────────┴──────────┴──────────┴──────────┴─────────┤
│                   依赖层 (Dependencies)                │
│     dayjs / i18next / lunar-lite / lunar-typescript   │
└─────────────────────────────────────────────────────┘
```

### 1.1 模块职责

| 模块 | 目录 | 核心职责 |
|------|------|---------|
| **astro** | `src/astro/` | 排盘流程编排、宫位系统、运限系统、星盘分析器 |
| **star** | `src/star/` | 星曜定位算法：14 主星、14 辅星、38+ 杂耀、48 神煞、流耀 |
| **data** | `src/data/` | 天干地支数据、星曜信息表（亮度、五行、四化表）、类型定义 |
| **i18n** | `src/i18n/` | 国际化框架、6 种语言的字典型资源文件、类型安全的翻译桥接 |
| **utils** | `src/utils/` | 通用工具函数：索引修正、亮度获取、四化判断等 |

### 1.2 分层原则

- **数据层（data）** 不依赖任何其他模块，只定义常量、类型和数据结构
- **星曜层（star）** 依赖 data 和 util，完成星曜的数学定位
- **宫盘层（astro）** 依赖 star、data、util，编排完整的排盘流程
- **国际化层（i18n）** 独立但被所有输出模块依赖
- **工具层（utils）** 纯函数，无副作用

这种设计遵循了 **单向依赖** 原则，下层模块不感知上层模块的存在，有利于单元测试和模块复用。

---

## 2. 核心设计模式分析

### 2.1 Fluent Interface（链式调用）

iztro 最显著的设计风格是 Fluent Interface 模式，即链式调用 API。其设计链如下：

```typescript
astrolabe
  .palace("命宫")        // → IFunctionalPalace
    .has(["紫微", "右弼"])  // → boolean
  .star("紫微")          // → IFunctionalStar
    .palace()            // → IFunctionalPalace
    .surroundedPalaces() // → IFunctionalSurpalaces
      .have(["禄存"])     // → boolean
```

**实现机制：**

每个 `Functional*` 类都同时持有对自身数据的引用和对父级容器的引用：

```
FunctionalAstrolabe
  ├── palaces: Palace[]           // 原始宫位数据
  ├── palace(name): IFunctionalPalace  // 返回宫位对象
  ├── star(name): IFunctionalStar      // 返回星曜对象
  └── horoscope(...): IFunctionalHoroscope

IFunctionalPalace (extends Palace)
  ├── 继承 Palace 的所有原始数据（name, stars, heavenlyStem 等）
  ├── has() / notHave() / hasOneOf()    // 星曜查询
  ├── hasMutagen() / selfMutaged()      // 四化查询
  ├── fliesTo() / mutagedPlaces()       // 飞星查询
  └── astrolabe(): IFunctionalAstrolabe // 返回所属星盘

IFunctionalStar (extends Star)
  ├── 继承 Star 的原始数据（name, type, brightness 等）
  ├── palace(): IFunctionalPalace       // 所在宫位
  ├── surroundedPalaces()               // 三方四正
  ├── withBrightness() / withMutagen()  // 属性判断
  └── setPalace() / setAstrolabe()      // 内部关联设置
```

这种设计的优势在于：
1. **可读性强**：查询语句接近自然语言
2. **类型安全**：每一步返回的中间类型都经过 TypeScript 类型定义
3. **状态封装**：中间对象持有必要的上下文，无需用户手动传递

### 2.2 接口-实现分离模式（Interface Segregation）

iztro 严格区分了 **数据结构接口** 和 **功能接口**：

```
Palace (纯数据)  ←  IFunctionalPalace (功能接口)  ←  FunctionalPalace (实现)
Star   (纯数据)  ←  IFunctionalStar   (功能接口)  ←  FunctionalStar   (实现)
```

例如 `IFunctionalPalace extends Palace`，其中 `Palace` 只包含 `name`、`heavenlyStem`、`earthlyBranch`、`majorStars` 等数据字段，而 `IFunctionalPalace` 额外声明 `has()`、`notHave()` 等方法。这种分离使得：
- **数据传输对象（DTO）** 与 **业务逻辑对象** 解耦
- **序列化兼容**：纯数据部分可无损 JSON 序列化
- **测试便利**：可 mock 数据层独立测试逻辑层

### 2.3 工厂模式（Factory Method）

排盘入口提供两种工厂方法：

```typescript
// 阳历工厂
astro.bySolar(solarDateStr, timeIndex, gender, fixLeap?, language?)

// 农历工厂  
astro.byLunar(lunarDateStr, timeIndex, gender, fixLeap?, language?)

// 统一配置工厂
astro.withOptions(options)
```

内部实现中，`byLunar` 会先通过 `lunar-lite` 库将农历转换为阳历，然后复用 `bySolar` 的核心排盘逻辑。这种模式体现了 **单一职责原则**—每个工厂方法只处理一种输入格式的转换逻辑。

### 2.4 策略模式（Strategy）— 算法流派可配置

通过 `astro.config()` 支持不同流派的排盘算法：

```typescript
astro.config({ algorithm: 'zhongzhou' })  // 切换到中州派算法
```

内部实现中，不同流派在以下方面存在差异：
- 天使/天伤的安星规则
- 截路空亡/空亡的处理
- 大耗的命名差异
- 是否包含截空、劫杀、大耗、龙德等杂耀

配置系统采用 **浅合并（shallow merge）** 策略，用户只需提供与默认值不同的选项，未指定的选项自动回退到默认值。

### 2.5 装饰器模式（通过插件系统）

插件系统实质上实现了类似装饰器模式的效果：

```typescript
astro.loadPlugin(myPlugin)
// 之后所有 bySolar / byLunar 生成的 astrolabe 实例都附加了插件方法
```

插件的 TypeScript 实现依赖 **声明合并（Declaration Merging）**：

```typescript
interface IAstrolabe extends FunctionalAstrolabe {
  myNewFunc: () => string
}

astro.loadPlugin(function (this: IAstrolabe) {
  this.myNewFunc = () => this.fiveElementsClass
})
```

这种设计利用 `this` 类型的显式标注，在保留 TypeScript 类型安全的同时实现了方法的动态注入。

---

## 3. 类型系统设计

### 3.1 双类型桥接架构（Dual-Type Bridge）

iztro 最具创新性的设计是 **双类型桥接**：

```
用户输入（任意语言字符串）
        │
        ▼
  kot() 逆查（key of translation）
        │
        ▼
  内部英文 key（如 'ziweiMaj'）
        │
        ▼
  算法执行（基于内部 key）
        │
        ▼
  t() 正查（translate）
        │
        ▼
  用户输出（指定语言字符串）
```

**类型层面：**

```typescript
// 内部类型（算法层）
type StarKey = 'ziweiMaj' | 'tianjiMaj' | 'taiyangMaj' | ...

// 用户类型（多语言层）
type StarName = StarZhCN | StarEnUS | StarJaJP | StarKoKR | StarViVN
// = '紫微' | 'emperor' | '紫微(日本語)' | ... | 

// 桥接函数
function t<T>(key: StarKey): T        // key → 翻译值
function kot<T>(value: string): T     // 翻译值 → key
```

这种设计的优点是：
1. **用户可以用母语调用 API**，无需记忆中文术语
2. **内部逻辑始终保持一致**，不受语言影响
3. **TypeScript 类型安全**：传入的语言字符串在编译期即被类型检查
4. **可扩展**：新增语言只需添加 locale 文件和更新联合类型

### 3.2 类型定义的层级结构

```
data/types/
├── index.ts        // 统一导出
├── general.ts      // Language, YinYang, FiveElements, Scope, StarType 等基础类型
├── star.ts         // Star 接口（name, type, brightness, mutagen 等）
├── astro.ts        // Astrolabe, Horoscope, Config, Option 等
└── palace.ts       // Palace, SoulAndBody, Decadal 等
```

所有功能性接口（`IFunctional*`）定义在使用它们的模块中（如 `FunctionalAstrolabe.ts`），而非 data 层，进一步体现了关注点分离。

---

## 4. 国际化架构

### 4.1 技术选型：i18next

iztro 使用 `i18next` v23 作为国际化框架。原因在于：
- i18next 是目前生态最成熟的 JS i18n 方案
- 支持嵌套键值对、复数、插值等功能
- 支持动态语言切换

### 4.2 资源结构

每个语言目录包含 8 个资源文件：

```
locales/{locale}/
├── index.ts              # 聚合导出
├── common.json           # 通用术语（生肖、星座、时辰）
├── star.ts               # 星曜名称
├── palace.ts             # 宫位名称
├── gender.ts             # 性别
├── heavenlyStem.ts       # 天干
├── earthlyBranch.ts      # 地支
├── fiveElementsClass.ts  # 五行局
├── brightness.ts         # 星曜亮度
└── mutagen.ts            # 四化名称
```

### 4.3 类型安全的翻译桥接

`kot()`（Key of Translation）是 iztro 自定义的函数，其核心功能是根据当前语言的翻译值反查内部 key。实现逻辑：

```typescript
function kot<T>(value: string, category?: string): T {
  // 遍历 i18next 的资源，找到 value 对应的 key
  // 如果指定了 category，则只在该分类下查找
}
```

这种反向查找的设计在 TypeScript 生态中较为少见，它解决了一个核心矛盾：**用户应该能用母语输入，而算法需要恒定的内部标识**。

### 4.4 翻译策略分析

以星曜翻译为例，iztro 采用了 **意译为主、音译为辅** 的策略：

| 星曜 | 中文 | 英文 | 翻译策略 |
|------|------|------|---------|
| 紫微 | 紫微星 | Emperor | 意译（紫微星为帝星） |
| 天机 | 天机星 | Advisor | 意译（天机为谋士） |
| 太阳 | 太阳星 | Sun | 直译 |
| 武曲 | 武曲星 | Finance | 意译（武曲主财） |
| 天同 | 天同星 | Harmony | 意译 |
| 廉贞 | 廉贞星 | Politics | 意译 |
| 天府 | 天府星 | Governor | 意译 |
| 禄存 | 禄存星 | Prosperity | 意译 |

这种翻译策略在学术上值得关注，因为紫微斗数的术语体系蕴含了丰富的中国传统文化意象，如何在跨语言转换中保留其文化内涵是一个值得研究的课题。

---

## 5. 数据层设计

### 5.1 常量定义模式

`data/constants.ts` 使用 `as const` 断言定义不可变常量：

```typescript
export const HEAVENLY_STEMS = [
  'jiaHeavenly', 'yiHeavenly', 'bingHeavenly', 
  'dingHeavenly', 'wuHeavenly', 'jiHeavenly',
  'gengHeavenly', 'xinHeavenly', 'renHeavenly', 'guiHeavenly'
] as const

export const EARTHLY_BRANCHES = [
  'ziBranch', 'chouBranch', 'yinBranch', 'maoBranch',
  'chenBranch', 'siBranch', 'wuBranch', 'weiBranch',
  'shenBranch', 'youBranch', 'xuBranch', 'haiBranch'
] as const
```

`as const` 使得 TypeScript 推断出最具体的字面量类型（literal types），而非泛化 `string[]`，从而提供了编译期的最大类型安全性。

### 5.2 知识库的数据建模

iztro 将紫微斗数的专业知识建模为结构化数据：

**天干属性**（`data/heavenlyStems.ts`）：
```typescript
{
  yinYang: 'yang' | 'yin',
  fiveElements: 'wood' | 'fire' | 'earth' | 'metal' | 'water',
  crash: EarthlyBranchKey,       // 对冲
  mutagen: [StarKey, StarKey, StarKey, StarKey]  // 四化序列
}
```

**星曜亮度表**（`data/stars.ts`）：
```typescript
STARS_INFO: {
  [key: string]: {
    brightness: Brightness[]  // 12 宫的亮度数组（从寅宫起索引）
    fiveElements: FiveElements
    yinYang: YinYang
  }
}
```

**地支属性**（`data/earthlyBranches.ts`）：
```typescript
{
  yinYang: 'yang' | 'yin',
  fiveElements: FiveElements,
  crash: EarthlyBranchKey,       // 六冲
  soul: StarKey,                 // 命主星
  body: StarKey,                 // 身主星
  inside: string,                // 体内器官
  outside: string                // 体外器官
}
```

**五虎遁/五鼠遁**（`data/constants.ts`）：
```typescript
TIGER_RULE: { [stem: string]: EarthlyBranchKey[] }
// 甲己之年丙作首 → { jiaHeavenly: [bingHeavenly, ...], ... }

RAT_RULE: { [stem: string]: EarthlyBranchKey[] }
// 甲己还加甲 → { jiaHeavenly: [jiaHeavenly, ...], ... }
```

这种结构化数据建模方式，将传统口诀和表格知识转化为可计算的数据结构，是传统文化数字化的重要方法论。

### 5.3 可配置性设计

`astro.config()` 支持对以下参数的覆盖：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `mutagens` | `Partial<Record<HeavenlyStem, StarKey[]>>` | 默认四化表 | 自定义天干四化 |
| `brightness` | `Partial<Record<StarKey, Brightness[]>>` | 默认亮度表 | 自定义星曜亮度 |
| `algorithm` | `'default' \| 'zhongzhou'` | `'default'` | 算法流派 |
| `yearDivide` | `'normal' \| 'exact'` | `'normal'` | 年度分界（正月初一/立春） |
| `horoscopeDivide` | `'normal' \| 'exact'` | `'normal'` | 运限年度分界 |
| `ageDivide` | `'normal' \| 'birthday'` | `'normal'` | 年龄计算方式 |
| `dayDivide` | `'current' \| 'forward'` | `'current'` | 晚子时归属 |

这种配置设计体现了 **Strategy 模式** 与 **Template Method 模式** 的结合，允许用户在保持整体算法流程不变的前提下，替换特定环节的具体规则。

---

## 6. 测试与质量保障

### 6.1 测试架构

iztro 使用 Jest + ts-jest 进行单元测试，测试文件位于 `src/__tests__/` 目录下：

```
src/__tests__/
├── astro/
│   ├── astro.test.ts      # 排盘入口测试
│   ├── palace.test.ts     # 宫位功能测试
│   ├── analyzer.test.ts   # 分析器测试
│   └── plugin.test.ts     # 插件系统测试
├── star/
│   ├── star.test.ts       # 星曜功能测试
│   └── location.test.ts   # 星曜定位测试
└── utils/
    └── index.test.ts      # 工具函数测试
```

### 6.2 CI/CD 管线

项目配置了 GitHub Actions，包含：
- `Codecov.yaml` — 代码覆盖率追踪
- ESLint 静态检查
- Jest 测试执行
- UMD 打包（webpack）
- TypeScript 编译（tsc）

### 6.3 代码质量配置

- **ESLint**：`.eslintrc.json` 采用 `standard-with-typescript` 风格
- **Prettier**：`.prettierrc` 统一代码格式
- **TypeScript**：`tsconfig.json` 配置了严格模式（`strict: true`）

---

## 7. 构建与发布

### 7.1 多格式输出

iztro 支持三种模块格式的输出：

| 输出格式 | 命令 | 入口 |
|---------|------|------|
| CommonJS + ESM | `tsc` | `lib/index.js` |
| UMD (浏览器) | `webpack` | `dist/iztro.min.js` |
| TypeScript 类型 | `tsc` | `lib/index.d.ts` |

```json
{
  "main": "lib/index.js",         // CJS
  "types": "lib/index.d.ts",      // 类型定义
  "unpkg": "dist/iztro.min.js",   // CDN (UMD)
  "jsdelivr": "dist/iztro.min.js" // CDN (jsDelivr)
}
```

### 7.2 版本管理流程

```json
{
  "preversion": "yarn lint",                              // 版本前检查
  "version": "yarn format && git add -A src",             // 版本时格式化
  "postversion": "git push && git push --tags",           // 版本后推送
  "prepublishOnly": "npm test && yarn lint && yarn build:umd"  // 发布前验证
}
```

这个流程保证了每次发布前都经过了 Lint、测试和构建，符合语义化版本发布的最佳实践。

### 7.3 依赖管理

**生产依赖：**

| 依赖 | 版本 | 用途 |
|------|------|------|
| `dayjs` | ^1.11.10 | 日期处理 |
| `i18next` | ^23.5.1 | 国际化框架 |
| `lunar-lite` | ^0.2.8 | 农历/阳历转换、干支计算 |
| `lunar-typescript` | ^1.7.8 | （补充农历工具） |

**开发依赖：** 包含 TypeScript 编译、Jest 测试、ESLint、Prettier、Webpack 打包等标准工具链。

值得注意的是 `lunar-typescript` 与 `lunar-lite` 同时存在，后者是前者的轻量版本，iztro 核心排盘主要依赖 `lunar-lite`，而 `lunar-typescript` 可能用于补充功能或备选。

---

## 8. 架构设计评估

### 8.1 优势

1. **单一职责明确**：每个模块有清晰的边界和职责
2. **类型安全极致**：从数据层到用户 API，TypeScript 类型覆盖全面
3. **领域驱动**：代码结构直接映射紫微斗数的领域概念（宫、星、四化、运限等）
4. **可扩展性**：配置系统、插件系统、多语言系统都体现了良好的扩展点
5. **链式调用**：减少临时变量，提升代码表达力

### 8.2 可讨论的点

1. **`kot()` 反向查找的性能**：在资源较多时，反向遍历所有 i18n 资源的性能需要关注，尤其是在频繁调用的场景
2. **`FunctionalStar` 的双向引用**：`setPalace()` 和 `setAstrolabe()` 方法引入了可变状态和循环引用（astrolabe → palace → star → astrolabe），在纯函数式编程视角下不够理想
3. **插件系统的类型安全**：插件用户需要手动声明接口继承，增加了使用复杂度
4. **测试覆盖范围**：从目录结构看，核心算法（location.test.ts）和功能类（palace.test.ts, star.test.ts）有覆盖，但数据层的常量测试可能不足

### 8.3 与传统 OOP 设计的对比

iztro 的设计更接近 **函数式 + 面向对象混合风格**：
- 星曜定位算法（`star/location.ts`、`star/majorStar.ts` 等）以纯函数为主
- 功能性类（`FunctionalAstrolabe`、`FunctionalPalace`）以 OOP 为主
- 数据层以声明式常量为主

这种混合风格在工程实践中被证明是有效的：算法逻辑用纯函数便于测试和推理，API 层用 OOP 便于链式调用和状态封装。

---

## 9. 小结

iztro 的软件工程实现体现了以下特点：
- 对紫微斗数领域知识的系统性数字化建模
- 双类型桥接的 i18n 设计的创新性
- Fluent Interface 在复杂查询场景的成功应用
- 模块化、可配置、可扩展的架构设计

其设计的核心思想是：**将东方传统文化的隐性知识（口诀、规则）转化为显性的、可计算的结构化数据和算法**，这种方法论对于其他传统文化数字化项目具有参考价值。
