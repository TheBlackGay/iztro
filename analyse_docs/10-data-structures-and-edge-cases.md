# 数据结构定义与边缘情况目录

> 本文档提供语言无关的数据结构定义和已知的边缘情况说明。

---

## 1. 数据结构定义（JSON Schema 风格）

### 1.1 Astrolabe（星盘）

```
Astrolabe {
  gender:        string          // 性别（如 "男"、"female"）
  solarDate:     string          // 阳历日期 "YYYY-M-D"
  lunarDate:     string          // 农历日期
  chineseDate:   string          // 四柱干支 "庚辰 甲申 丙午 庚寅"
  time:          string          // 时辰名称
  timeRange:     string          // 时间段 "03:00~05:00"
  sign:          string          // 星座
  zodiac:        string          // 生肖
  earthlyBranchOfSoulPalace: string  // 命宫地支
  earthlyBranchOfBodyPalace: string  // 身宫地支
  soul:          string          // 命主
  body:          string          // 身主
  fiveElementsClass: string      // 五行局
  palaces:       Palace[12]      // 十二宫（从寅位开始）
  rawDates: {                    // 原始日期数据
    lunarDate: { ... },          // 农历日期对象
    chineseDate: { ... }         // 干支日期对象
  }
  copyright:     string          // 版权信息
}
```

### 1.2 Palace（宫位）

```
Palace {
  index:            number          // 宫位索引 0~11
  name:             string          // 宫位名称
  isBodyPalace:     boolean         // 是否身宫
  isOriginalPalace: boolean         // 是否来因宫
  heavenlyStem:     string          // 宫位天干
  earthlyBranch:    string          // 宫位地支
  majorStars:       Star[]          // 主星（含禄存、天马）
  minorStars:       Star[]          // 辅星（14 颗）
  adjectiveStars:   Star[]          // 杂耀（30+ 颗）
  changsheng12:     string          // 长生12神之一
  boshi12:          string          // 博士12神之一
  jiangqian12:      string          // 将前12神之一
  suiqian12:        string          // 岁前12神之一
  decadal:          Decadal         // 大限信息
  ages:             number[]        // 小限数组（10 个年龄）
}
```

### 1.3 Star（星曜）

```
Star {
  name:        string    // 星曜名称
  type:        string    // 类型: major|soft|tough|adjective|flower|helper|lucun|tianma
  scope:       string    // 作用域: origin|decadal|yearly|monthly|daily|hourly
  brightness:  string?   // 亮度（可选，无亮度时为 "" 或 null）
  mutagen:     string?   // 四化（可选，未产生四化时为 null）
}
```

### 1.4 Decadal（大限）

```
Decadal {
  range:          [number, number]  // 起止年龄 [start, end]
  heavenlyStem:   string            // 大限天干
  earthlyBranch:  string            // 大限地支
}
```

### 1.5 Horoscope（运限）

```
Horoscope {
  lunarDate:  string              // 农历日期
  solarDate:  string              // 阳历日期
  decadal:    HoroscopeItem       // 大限
  age:        HoroscopeItem & {   // 小限
    nominalAge: number            // 虚岁
  }
  yearly:     HoroscopeItem & {   // 流年
    yearlyDecStar: {
      jiangqian12: string[]
      suiqian12:   string[]
    }
  }
  monthly:    HoroscopeItem       // 流月
  daily:      HoroscopeItem       // 流日
  hourly:     HoroscopeItem       // 流时
}
```

### 1.6 HoroscopeItem（运限项目）

```
HoroscopeItem {
  index:          number      // 宫位索引
  name:           string      // 运限名称
  heavenlyStem:   string      // 天干
  earthlyBranch:  string      // 地支
  palaceNames:    string[12]  // 12 宫名称列表
  mutagen:        string[]    // 四化星名称数组
  stars?:         Star[][]    // 流耀（可选）
}
```

### 1.7 SurroundedPalaces（三方四正）

```
SurroundedPalaces {
  target:   Palace    // 本宫
  opposite: Palace    // 对宫
  wealth:   Palace    // 财帛位（三合）
  career:   Palace    // 官禄位（三合）
}
```

### 1.8 Config（配置）

```
Config {
  mutagens?:        Record<string, string[]>   // 自定义四化表
  brightness?:      Record<string, string[]>   // 自定义亮度表
  yearDivide?:      "normal" | "exact"         // 年分界
  horoscopeDivide?: "normal" | "exact"         // 运限分界
  ageDivide?:       "normal" | "birthday"      // 年龄分界
  dayDivide?:       "current" | "forward"      // 晚子时分界
  algorithm?:       "default" | "zhongzhou"    // 算法流派
}
```

### 1.9 Input Option（排盘参数）

```
Option {
  type:         "solar" | "lunar"    // 日期类型
  dateStr:      string                // 日期 "YYYY-M-D"
  timeIndex:    number                // 时辰索引 0~12
  gender:       string                // 性别
  isLeapMonth?: boolean               // 是否闰月（仅农历）
  fixLeap?:     boolean               // 是否修正闰月
  language?:    string                // 语言
  config?:      Config                // 配置
  astroType?:   "heaven"|"earth"|"human"  // 星盘类型
}
```

### 1.10 Star 类型枚举

| 类型 | 含义 | 包含 |
|------|------|------|
| `major` | 主星 | 紫微、天机等 14 颗 |
| `soft` | 吉星(辅) | 左辅、右弼、文昌、文曲、天魁、天钺 |
| `tough` | 煞星(辅) | 地空、地劫、火星、铃星、擎羊、陀罗 |
| `lucun` | 禄存 | 禄存 |
| `tianma` | 天马 | 天马 |
| `adjective` | 杂耀 | 红鸾、天喜、三台、八座 等 30+ 颗 |
| `flower` | 桃花星 | 红鸾、天喜、天姚、咸池 |
| `helper` | 解神 | 月解、年解 |

---

## 2. 边缘情况目录

### 2.1 闰月处理

| 场景 | 规则 |
|------|------|
| 非闰月 | 按正常月份处理 |
| 闰月 + fixLeap=true + day<=15 | 算作上月 |
| 闰月 + fixLeap=true + day>15 | 算作下月 |
| 闰月 + fixLeap=false | 按原月份处理 |
| 闰月 + timeIndex=12（晚子时）| 不触发闰月修正（日期不变） |

**算法**：
```
function fixLunarMonth(lunarMonth, lunarDay, isLeap, fixLeap, timeIndex):
    monthIdx = (lunarMonth + 1 - 寅索引) mod 12
    if isLeap and fixLeap and lunarDay > 15 and timeIndex != 12:
        monthIdx += 1
    return monthIdx mod 12
```

### 2.2 晚子时处理

| 配置 | timeIndex=12 时的处理 |
|------|---------------------|
| `dayDivide: 'current'`（默认） | timeIndex 重置为 0，日期不变 |
| `dayDivide: 'forward'` | timeIndex 不变(12)，日期加一天 |

### 2.3 年分界

| 配置 | 分界规则 |
|------|---------|
| `yearDivide: 'normal'`（默认）| 正月初一为年分界 |
| `yearDivide: 'exact'` | 立春为年分界 |

影响：
- 年干/年支的确定
- 大限顺逆的阴阳判断
- 流年/流月的计算

### 2.4 命宫索引的特殊值

| 情况 | 处理 |
|------|------|
| soulIndex = 0（命宫在寅位）| 正常处理 |
| soulIndex 使用 fixIndex 包装后 | 始终在 0~11 范围内 |
| bodyIndex 永远 ≠ soulIndex 的情况 | 可能相等（timeIndex=0 且 monthIndex=0 时） |
| 晚子时（timeIndex=12 重置为 0）| 与早子时计算结果相同 |

### 2.5 五行局特例

| 特殊情况 | 说明 |
|---------|------|
| 戊己中央土 | 戊干和己干的 `crash`（天干相冲）字段为空 |
| 水二局起始年龄 | 五行局数值=2，起运年龄=2 岁 |
| 火六局起始年龄 | 五行局数值=6，起运年龄=6 岁 |

### 2.6 紫微星定位特例

| 特殊情况 | 说明 |
|---------|------|
| 生日 D < 五行局 C | offset 至少需要 C-D 次迭代 |
| 生日 D 刚好整除 | offset=0，紫微星在 quotient-1 位置 |
| 生日 D=1, 五行局 C=6 | 需要 offset=5，迭代 5 次 |
| 最大迭代次数 | 不超过 5 次（C 最大为 6，D 最小为 1） |

### 2.7 四化特例

| 天干 | 特例说明 |
|------|---------|
| 戊 | 右弼（辅星）化科——唯一化科的辅星之一 |
| 己 | 文曲（辅星）化忌——唯一化忌的辅星之一 |
| 辛 | 文昌化忌、文曲化科——两颗辅星同时产生四化 |
| 壬 | 左辅（辅星）化科——唯一化科的辅星之一 |

### 2.8 中州派特例

| 差异点 | 说明 |
|-------|------|
| 天使/天伤互换 | 阴男阳女时，天使与天伤位置互换 |
| 命主算法 | 全书派用命宫地支，中州派用生年地支 |
| 截空 | 中州派将截路和空亡合并为截空一颗星 |
| 大耗命名 | 中州派岁前十二神中第 7 位称"岁破"而非"大耗" |
| 龙德/劫杀 | 中州派额外安龙德和劫杀 |
| 三盘 | 中州派有天盘、地盘、人盘三种命盘 |

### 2.9 亮度表特例

| 特殊情况 | 处理 |
|---------|------|
| 星曜在特定宫位无亮度 | 返回空字符串 `""`，不显示 |
| 星曜完全无亮度数据 | 如天厨、蜚廉等，全部 12 位为空 |
| 辅星亮度 | 部分辅星亮度数据不完整（如天魁只在 4 个宫位有数据）|

### 2.10 运限边界情况

| 场景 | 处理 |
|------|------|
| 流年跨年 | 流年以 `yearDivide` 配置为分界 |
| 流月循环 | 从流年命宫起，顺时针 12 月循环 |
| 同宫不同运限 | 同一宫位在不同运限中可能有不同星曜 |
| 大限超出 120 岁 | 理论上 12 宫 × 10 年 = 120 年，超过后循环 |

### 2.11 三方四正（三合）计算

三方四正包含四个宫位：
```
target   = 本宫
opposite = 对宫 = (target + 6) mod 12
wealth   = 财帛位 = (target + 4) mod 12  // 三合
career   = 官禄位 = (target + 8) mod 12  // 三合
```

**三合宫位对照表**：

| 本宫 | 对宫 | 财帛位 | 官禄位 |
|------|------|--------|--------|
| 0(寅) | 6(申) | 4(午) | 8(戌) |
| 1(卯) | 7(酉) | 5(未) | 9(亥) |
| 2(辰) | 8(戌) | 6(申) | 10(子) |
| 3(巳) | 9(亥) | 7(酉) | 11(丑) |
| 4(午) | 10(子) | 8(戌) | 0(寅) |
| 5(未) | 11(丑) | 9(亥) | 1(卯) |
| 6(申) | 0(寅) | 10(子) | 2(辰) |
| 7(酉) | 1(卯) | 11(丑) | 3(巳) |
| 8(戌) | 2(辰) | 0(寅) | 4(午) |
| 9(亥) | 3(巳) | 1(卯) | 5(未) |
| 10(子) | 4(午) | 2(辰) | 6(申) |
| 11(丑) | 5(未) | 3(巳) | 7(酉) |

### 2.12 空宫判定

空宫的定义：**宫位内没有主星（majorStars 为空）**。

可选的排除参数：某些流派认为特定星曜（如禄存、天马）的存在不改变空宫性质，可以通过 `excludeStars` 参数排除它们。

---

## 3. 索引约定

### 3.1 宫位索引

| 索引 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|------|---|---|---|---|---|---|---|---|---|---|---|---|
| 地支 | 寅 | 卯 | 辰 | 巳 | 午 | 未 | 申 | 酉 | 戌 | 亥 | 子 | 丑 |
| 地支索引 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 0 | 1 |

### 3.2 大限宫位顺序

阳男阴女：从命宫索引开始 **递增**（顺时针）
阴男阳女：从命宫索引开始 **递减**（逆时针）

```
// 阳男阴女：
大限 0: (soulIndex + 0) mod 12
大限 1: (soulIndex + 1) mod 12
大限 2: (soulIndex + 2) mod 12
...

// 阴男阳女：
大限 0: (soulIndex - 0) mod 12
大限 1: (soulIndex - 1) mod 12
大限 2: (soulIndex - 2) mod 12
...
```

### 3.3 小限年龄

每宫包含 10 个年龄，步长为 12：
```
宫位 i 的小限 = [12*j + (i+1) for j = 0..9]
```

阳男阴女：从 ageIndex 递增
阴男阳女：从 ageIndex 递减

### 3.4 最终输出格式

三方四正永远按以下固定顺序返回：
```
[0] target   = 本宫
[1] opposite = 对宫
[2] wealth   = 财帛位（三合）
[3] career   = 官禄位（三合）
```
