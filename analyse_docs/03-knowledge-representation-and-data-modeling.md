# iztro 数据与规则的知识表示分析

## 概述

紫微斗数是一个高度结构化的知识体系，包含大量的分类、映射和规则。iztro 将这些知识以数据结构的形式进行建模，使之可计算、可查询、可验证。本章从知识表示（Knowledge Representation）的视角，分析 iztro 如何将传统紫微斗数的隐性知识转化为显性的软件数据模型。

---

## 1. 知识表示的整体架构

iztro 的知识表示可分为三个层次：

```
┌──────────────────────────────────────────────────────────────┐
│                   第三层：规则层 (Rules)                       │
│    排盘规则、定位算法、四化映射、流派差异                     │
├──────────────────────────────────────────────────────────────┤
│                   第二层：关联层 (Relations)                   │
│    天干↔地支↔五行↔阴阳 的交叉映射关系                        │
│    (heavenlyStems.ts, earthlyBranches.ts)                    │
├──────────────────────────────────────────────────────────────┤
│                   第一层：实体层 (Entities)                    │
│    天干/地支/星曜/宫位/时辰/生肖的列表与枚举                   │
│    (constants.ts, stars.ts)                                  │
└──────────────────────────────────────────────────────────────┘
```

### 1.1 知识类型的分类

| 知识类型 | 示例 | 表示方法 | 文件 |
|---------|------|---------|------|
| **分类知识** | 十天干、十二地支、五行局 | 枚举 / `as const` 数组 | `constants.ts` |
| **属性知识** | 天干的阴阳五行、地支的六冲 | 对象属性 | `heavenlyStems.ts`, `earthlyBranches.ts` |
| **映射知识** | 年干→月干（五虎遁）、日干→时干（五鼠遁） | 键值对对象 | `constants.ts` |
| **表格知识** | 星曜亮度表、天干四化表 | 数组 / 对象 | `stars.ts`, `heavenlyStems.ts` |
| **规则知识** | 紫微星定位、命宫定位 | 函数实现 | `location.ts`, `palace.ts` |
| **流变知识** | 大限顺逆、流耀替换规则 | 条件分支 | `palace.ts`, `horoscopeStar.ts` |

---

## 2. 实体层 (Entities) — 基础概念的数字化

### 2.1 天干、地支的线性序列

天干和地支是最基础的计数系统，iztro 将其建模为不可变有序数组：

```typescript
// 10 天干
export const HEAVENLY_STEMS = [
  'jiaHeavenly', 'yiHeavenly', 'bingHeavenly', 'dingHeavenly', 'wuHeavenly',
  'jiHeavenly', 'gengHeavenly', 'xinHeavenly', 'renHeavenly', 'guiHeavenly'
] as const;  // → 长度为 10 的有序集合

// 12 地支
export const EARTHLY_BRANCHES = [
  'ziEarthly', 'chouEarthly', 'yinEarthly', 'maoEarthly',
  'chenEarthly', 'siEarthly', 'wuEarthly', 'weiEarthly',
  'shenEarthly', 'youEarthly', 'xuEarthly', 'haiEarthly'
] as const;  // → 长度为 12 的有序集合
```

**设计要点：**
- 使用 `as const` 断言使得 TypeScript 推断出精确的字面量联合类型
- 内部使用英文 key（如 `'jiaHeavenly'`）而非中文（`'甲'`），确保算法不依赖特定语言
- 数组下标天然对应序号（0=甲/子, 1=乙/丑, ...），便于数值计算

### 2.2 宫位序列与对齐

紫微斗数的 12 宫在地盘（寅宫起）上是固定排列的：

```typescript
// 固定顺序（从寅宫开始对应的宫位）
export const PALACES = [
  'soulPalace',       // 命宫     — 寅位(0)
  'parentsPalace',    // 父母宫    — 卯位(1)
  'spiritPalace',     // 福德宫    — 辰位(2)
  'propertyPalace',   // 田宅宫    — 巳位(3)
  'careerPalace',     // 官禄宫    — 午位(4)
  'friendsPalace',    // 交友宫    — 未位(5)
  'surfacePalace',    // 迁移宫    — 申位(6)
  'healthPalace',     // 疾厄宫    — 酉位(7)
  'wealthPalace',     // 财帛宫    — 戌位(8)
  'childrenPalace',   // 子女宫    — 亥位(9)
  'spousePalace',     // 夫妻宫    — 子位(10)
  'siblingsPalace',   // 兄弟宫    — 丑位(11)
] as const;
```

**关键的设计决策**：`PALACES` 是固定的抽象顺序，与实际星盘上的物理位置解耦。命宫被定位到某个地支后，宫位名称通过**循环移位**映射到物理位置。

**数学映射：**
```
实际位置 i 的宫名 = PALACES[(i - 命宫索引) mod 12]
```

这种设计使得宫位定位变成了纯粹的数组索引运算，无需维护复杂的映射表。

### 2.3 时辰的分段表示

时辰系统被建模为 13 个时段的数组（而非传统的 12 时辰），原因在于 iztro 区分了早子时和晚子时：

```typescript
export const CHINESE_TIME = [
  'earlyRatHour',  // 0: 00:00~01:00
  'oxHour',        // 1: 01:00~03:00
  // ...
  'pigHour',       // 11: 21:00~23:00
  'lateRatHour',   // 12: 23:00~00:00
] as const;
```

这是对传统时辰系统的精化处理，反映了不同流派对子时归属的不同观点。

### 2.4 五行局的数值化

五行局被建模为数值枚举，兼具 **分类标识** 和 **数量值** 的双重语义：

```typescript
export enum FiveElementsClass {
  water2nd = 2,  // 水二局
  wood3rd  = 3,  // 木三局
  metal4th = 4,  // 金四局
  earth5th = 5,  // 土五局
  fire6th  = 6,  // 火六局
}
```

**双重语义**：
- 作为**分类**：区分五种不同类型的命局
- 作为**数值**：值（2-6）直接用于紫微星定位算法（作为除数）和大限起始年龄（作为起运数）

这是一个值得关注的设计模式——**一个枚举同时承载类型信息和数值信息**。

---

## 3. 关联层 (Relations) — 知识图谱的节点关联

### 3.1 天干的属性建模

每个天干被建模为一个包含多维度属性的对象：

```typescript
const heavenlyStems = {
  jiaHeavenly: {
    yinYang: '阳',              // 阴阳属性
    fiveElements: '木',          // 五行属性  
    crash: 'gengHeavenly',       // 对冲关系（甲庚冲）
    mutagen: ['lianzhenMaj', 'pojunMaj', 'wuquMaj', 'taiyangMaj'],
    // 四化：[禄, 权, 科, 忌]
  },
  // ...
} as const;
```

**知识表示分析：**
- **属性维度**：每个天干有 4 个可计算属性（阴阳、五行、对冲、四化）
- **引用方式**：`crash` 指向另一个天干的 key，`mutagen` 指向星曜的 key，形成对象引用网络
- **结构性约束**：所有天干具有相同的属性结构（`as const` 保证了结构的完整性）

### 3.2 地支的属性建模

地支对象更丰富，包含 7 个维度的属性：

```typescript
ziEarthly: {
  yinYang: '阳',        // 阴阳属性
  fiveElements: '水',    // 五行属性
  crash: 'wuEarthly',    // 六冲（子午冲）
  soul: 'tanlangMaj',    // 命主星（贪狼）
  body: 'huoxingMin',    // 身主星（火星）
  inside: '胆',          // 体内对应器官
  outside: '下体',       // 体表对应部位
  healthTip: '生殖系统、膀胱、尿道之疾病，听觉障碍'  // 健康提示
}
```

**知识维度分析：**

| 维度 | 知识类型 | 用途 |
|------|---------|------|
| `yinYang` | 分类属性 | 判断大限顺逆 |
| `fiveElements` | 分类属性 | 纳音五行计算 |
| `crash` | 二元关系 | 六冲判断 |
| `soul` / `body` | 星曜关联 | 命主/身主查询 |
| `inside` / `outside` | 医学知识 | 身体部位对应 |
| `healthTip` | 医学知识 | 健康建议 |

这实际上构建了一个 **天干地支的知识图谱**：12 个地支出点通过 `soul` 和 `body` 字段关联到星曜知识库，通过 `crash` 字段关联到其他地支。

### 3.3 天干与地支的交叉映射

**六十甲子纳音**是干支组合到五行局的映射，iztro 用算法替代了存储：

```typescript
// 纳音五行编码算法（而非查表）
stemNumber = floor(stemIndex / 2) + 1      // 天干映射到 1-5
branchNumber = floor((branchIndex mod 6) / 2) + 1  // 地支映射到 1-3
sum = (stemNumber + branchNumber) mod 5    // 归约到 1-5
result = [wood3rd, metal4th, water2nd, fire6th, earth5th][sum - 1]
```

这种设计体现了 **计算替代存储** 的原则：60 种组合如果用查表法需要 60 条记录，而算法只需数行代码即可覆盖全部组合。

### 3.4 五虎遁与五鼠遁

传统口诀被建模为 **键值对映射表**：

```typescript
// "甲己之年丙作首" → TIGER_RULE['jiaHeavenly'] = 'bingHeavenly'
export const TIGER_RULE = {
  jiaHeavenly: 'bingHeavenly',   // 甲年 → 丙寅月
  yiHeavenly: 'wuHeavenly',      // 乙年 → 戊寅月
  // ...
} as const;
```

```typescript
// "甲己还加甲" → RAT_RULE['jiaHeavenly'] = 'jiaHeavenly'
export const RAT_RULE = {
  jiaHeavenly: 'jiaHeavenly',    // 甲日 → 甲子时
  yiHeavenly: 'bingHeavenly',    // 乙日 → 丙子时
  // ...
} as const;
```

**知识表示特点：**
- 将口诀（顺口溜形式）转化为确定性映射
- 输入是年干/日干，输出是基准月干/时干
- 结果用于后续的偏移计算（天干的逐宫顺推）

---

## 4. 星曜知识库 (stars.ts) — 最复杂的知识结构

星曜知识库是 iztro 中最复杂的数据结构，包含亮度表、五行属性和阴阳属性。

### 4.1 亮度表的结构化存储

每颗星曜的亮度用 12 元素数组表示，对应 12 个地支位置：

```typescript
ziweiMaj: {
  brightness: [
    'wang', 'wang', 'de',  'wang', 'miao', 'miao',
    'wang', 'wang', 'de',  'wang', 'ping', 'miao'
    //  寅      卯      辰      巳      午      未
    //  申      酉      戌      亥      子      丑
  ],
  fiveElements: '土',
  yinYang: '阴',
}
```

**数组索引与其映射的地支固定对应：**

| 索引 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|------|---|---|---|---|---|---|---|---|---|---|---|---|
| 地支 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 | 子 | 丑 |

`brightness[index]` 直接给出星曜在该宫的亮度等级。

**亮度等级：**
```typescript
'庙'(miao) > '旺'(wang) > '得'(de) > '利'(li) > '平'(ping) > '不'(bu) > '陷'(xian)
// 空字符串 '' 表示该星在该宫无亮度
```

### 4.2 亮度表的数据分析

14 主星的亮度分布呈现规律性模式：

| 星曜 | 庙位数量 | 陷位数量 | 最高亮度位置 |
|------|---------|---------|------------|
| 紫微 | 2 | 0 | 午、未、丑 |
| 天机 | 2 | 1 | 午、亥、卯(庙) |
| 太阳 | 1 | 3 | 卯(庙) |
| 武曲 | 2 | 0 | 巳、亥、丑(庙) |
| 天同 | 2 | 3 | 子、午(庙) |
| 廉贞 | 0 | 0 | 寅、午、申(庙) |
| 天府 | 5 | 0 | 寅、辰、午、申、亥(庙) |
| 太阴 | 3 | 3 | 亥、子、丑(庙) |
| 贪狼 | 2 | 1 | 辰、未、亥(庙) |
| 巨门 | 3 | 1 | 寅、卯、丑(庙) |
| 天相 | 4 | 1 | 寅、午、申、亥(庙) |
| 天梁 | 5 | 0 | 寅、卯、辰、午、丑(庙) |
| 七杀 | 7 | 0 | 除卯、酉外全面强势 |
| 破军 | 2 | 1 | 戌、丑、午(庙) |

**观察**：七杀星有 7 个庙位、天梁和天fǔ各有 5 个庙位，均为亮度较高的星曜。太阳有 3 个陷位（申、戌、子），在日落后的位置亮度最低，这与中国古代"太阳东升西落"的意象一致。

### 4.3 辅星和杂耀的亮度

与主星不同，辅星和杂耀的亮度数据往往是不完整的，很多位置为空字符串：

```typescript
// 天魁 — 只在卯、戌、亥、子有亮度
tiankuiMin: { brightness: ['', 'miao', '', '', '', '', '', '', '', 'wang', 'wang', 'wang'] }

// 天钺 — 只在辰、午、未、申有亮度
tianyueMin: { brightness: ['', '', '', 'wang', '', 'wang', 'miao', 'miao', '', '', '', ''] }

// 散星 — 完全没有亮度数据
tianchu: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] }
```

**设计意义**：亮度为空表示该星在该宫位"不论亮度"，即不产生庙陷的影响。这是对传统紫微斗数"星辰有庙陷之分，非星辰不论庙陷"规则的忠实体现。

### 4.4 四化映射

四化被定义为星曜数组，数组下标对应四化类型：

```typescript
export const MUTAGEN = ['sihuaLu', 'sihuaQuan', 'sihuaKe', 'sihuaJi'] as const;
// 下标：0=禄, 1=权, 2=科, 3=忌
```

天干四化表引用星曜 key：

```typescript
// 甲年: [廉贞禄, 破军权, 武曲科, 太阳忌]
jiaHeavenly: { mutagen: ['lianzhenMaj', 'pojunMaj', 'wuquMaj', 'taiyangMaj'] }
```

四化查找函数通过 `indexOf` 实现：

```typescript
const getMutagen = (starName, heavenlyStemName) => {
  const target = heavenlyStems[heavenlyStem].mutagen
  const idx = target.indexOf(starKey)
  return idx >= 0 ? MUTAGEN[idx] : undefined
}
```

这种设计的精妙之处在于：
- 数组下标天然编码了四化类型（0=禄, 1=权, 2=科, 3=忌）
- 无需额外维护四化类型字段
- `indexOf` 同时完成"是否四化"和"何种四化"两个查询

---

## 5. 缺失信息的处理策略

### 5.1 空字符串与 undefined

iztro 中有两种方式表示"没有数据"：

1. **空字符串 `''`**：用于亮度表中表示该星在特定宫位不产生亮度效应
2. **`undefined`**：用于 `Star` 类型中表示未设定属性

```typescript
export type Star = {
  brightness?: Brightness;   // undefined 表示无亮度
  mutagen?: Mutagen;         // undefined 表示未产生四化
};
```

而在亮度表中，空值用空字符串而非 undefined 表示：
```typescript
tiankuiMin: { brightness: ['', 'miao', '', '', ...] }
//                         ↑ 空字符串
```

这种差异是因为亮度表是一个固定长度的字符串数组（`string[]`），空字符串是最直观的"空"表示。

### 5.2 缺失亮度数据的处理

在 `getBrightness()` 函数中：

```typescript
const getBrightness = (starName, index) => {
  const targetBrightness = STARS_INFO[star]?.brightness
  if (!targetBrightness) return ''    // 星曜不在 STARS_INFO 中
  return t(targetBrightness[index])   // 返回亮度值或空字符串
}
```

空字符串的亮度值在输出时被保留，这意味着前端在渲染时可以判断是否显示亮度信息。

---

## 6. 类型系统的知识约束

### 6.1 领域类型的定义

iztro 通过 TypeScript 类型系统对领域知识进行约束：

```typescript
// 领域基本类型
type YinYang = '阴' | '阳'
type FiveElements = '木' | '金' | '水' | '火' | '土'
type Scope = 'origin' | 'decadal' | 'yearly' | 'monthly' | 'daily' | 'hourly'
type StarType = 'major' | 'soft' | 'tough' | 'adjective' | 'flower' | 'helper' | 'lucun' | 'tianma'
```

**领域约束的效果：**
- 所有接受阴阳、五行作为参数的函数在编译期就保证了值的合法性
- `Scope` 限定了 6 种可能的作用域，覆盖了紫微斗数的全部运限层次
- `StarType` 的 8 种分类覆盖了紫微斗数的星曜分类体系

### 6.2 多语言类型的联合约束

iztro 最独特的类型设计是通过联合类型将多语言术语纳入类型系统：

```typescript
// 每种语言定义一个类型
type StarZhCN = '紫微' | '天机' | ... | '破军'
type StarEnUS = 'emperor' | 'advisor' | ... | 'destroyer'

// 合为联合类型
type StarName = StarZhCN | StarEnUS | StarJaJP | StarKoKR | StarViVN
```

这使得用户可以用任意支持的语言调用 API 并获得编译期类型检查。

### 6.3 配置类型的结构化约束

配置类型通过可选字段和联合类型约束用户输入：

```typescript
type Config = {
  yearDivide?: 'normal' | 'exact'     // 只能选 normal 或 exact
  algorithm?: 'default' | 'zhongzhou' // 只能选 default 或 zhongzhou
  dayDivide?: 'current' | 'forward'   // 只能选 current 或 forward
  // ...
}
```

这种设计使得配置选项的合法性在编译期被保证，无效配置无法通过类型检查。

---

## 7. 知识表示的评估

### 7.1 设计的优点

1. **计算替代存储**：纳音五行、紫微星定位等知识用算法替代了查表，兼顾了准确性和代码简洁性
2. **引用网络**：天干→星曜、地支→星曜之间的引用形成了轻量级的知识图谱
3. **类型约束**：TypeScript 的类型系统被用于强化领域知识的正确性
4. **语言无关的内部表示**：内部使用英文 key，避免了算法层面对特定语言的依赖
5. **可配置性**：Starlight 表和四化表均可被用户覆盖，支持不同流派研究

### 7.2 值得讨论的点

1. **亮度表的冗余性**：许多辅星和杂耀的亮度表大部分为空字符串，数据密度较低。或可考虑用更紧凑的结构（如 `Record<number, Brightness>`）仅记录非空位置。

2. **多语言词典的维护成本**：当前 6 种语言的星光名翻译需要手动维护，新语言需要新增完整文件。对于非东亚语言（如印欧语系），紫微斗数的概念翻译没有标准可循。

3. **隐含知识**：部分知识仍隐含在算法（如大限顺逆的阴阳比对）中，而非以结构化数据呈现。对于学术研究来说，完全结构化的知识库可能更便于分析。

4. **数据的完整性**：天干数据中 `wuHeavenly` 缺少 `crash` 字段（戊己土中央无冲），这是一个有意义的缺失，但在类型上没有被强制约束。

---

## 8. 知识图谱的构建分析

iztro 实际构建了一个隐式的知识图谱，节点类型包括：

```
节点类型:
  ├── 天干 (10个)  ←── 属性：阴阳、五行、对冲、四化
  ├── 地支 (12个)  ←── 属性：阴阳、五行、对冲、命主、身主、体脏
  ├── 星曜 (60+)   ←── 属性：亮度(12宫)、五行、阴阳
  ├── 宫位 (12个)  ←── 属性：名称序列
  └── 时辰 (13个)  ←── 属性：时间段

边类型:
  ├── 对冲 (天干之间、地支之间)
  ├── 命主 (地支 → 星曜)
  ├── 身主 (地支 → 星曜)
  ├── 四化 (天干 → 星曜)
  └── 位置 (星曜 → 宫位)
```

虽然这个图没有被显式构建为图数据库或 RDF 三元组，但其思想是一致的。如果将 iztro 的数据导出为 JSON-LD 或知识图谱格式，将是一个有价值的学术产出。

---

## 9. 与其他传统文化数字化的比较

| 项目 | 领域 | 知识表示策略 | 类似度 |
|------|------|-------------|-------|
| iztro | 紫微斗数 | 数组+对象+枚举+算法 | — |
| 万年历库 | 农历 | 查表法（预计算数百年数据） | 低 |
| 中医知识库 | 中医 | 本体论(Ontology)+推理规则 | 中 |
| 易经库 | 周易 | 六十四卦结构化+变换算法 | 高 |

iztro 更接近 **易经库** 的知识表示策略：将领域核心概念结构化编码，将变化规则用算法实现，而非预计算所有可能的结果。

---

## 10. 小结

iztro 的知识表示策略体现了以下原则：

1. **实体层用数组和枚举** — 保证有序性和类型安全
2. **关联层用对象引用** — 通过 key 在实体间建立关联网络
3. **规则层用函数实现** — 将口诀转化为可计算算法
4. **缺失用空值表示** — 空字符串和 undefined 各司其职
5. **类型系统强化领域约束** — 编译期保证知识的正确性

这种多层次的知识表示方法对于其他传统文化数字化项目具有参考价值，特别是在保持原始知识结构的完整性和精确性的同时，使其具备可计算和可查询的现代软件特性。
