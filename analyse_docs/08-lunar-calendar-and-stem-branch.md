# 农历与干支计算算法

> 本文档提供语言无关的农历转换和干支计算算法，
> 供其他语言实现时参考。iztro 依赖 `lunar-lite` 和 `lunar-typescript` 库完成这些计算，
> 新语言实现时需要自行实现或移植。

---

## 1. 阳历转农历

### 1.1 算法概述

阳历转农历的核心是查表法。农历是阴阳合历，其月份安排（大小月、闰月）由天文观测决定，
无法通过简单公式精确计算。通用的做法是：

1. 预计算 **农历数据表**（包含 1900-2100 年的农历月份信息）
2. 将阳历日期与农历表格对比，计算出对应的农历日期

### 1.2 农历数据表结构

农历数据表通常以**十六进制编码**存储每年农历信息：

```c
// 示例：每个元素编码一年的农历信息
// 各位含义：
// bit 0-3:  闰月月份（0=无闰月）
// bit 4-15: 每月大小月（1=30天大月，0=29天小月）
// bit 16-19: 闰月大小（1=30天，0=29天）
// bit 20-23: 春节偏移（可选）
const lunarYearInfo = [
    0x04bd8,  // 1900年
    0x04ae0,  // 1901年
    // ... 直到 2100年
];
```

**解码方法**：
```python
def decode_lunar_year(code):
    leap_month = code & 0xf                    # 闰月月份(0-12)
    leap_days = 30 if (code >> 16) & 0xf else 29  # 闰月天数
    month_days = []
    for i in range(12):
        month_days.append(30 if (code >> (4 + i)) & 1 else 29)  # 各月天数
    return leap_month, leap_days, month_days
```

### 1.3 阳历转农历算法

```python
def solar_to_lunar(year, month, day):
    """
    阳历日期 → 农历日期
    输入: 公历 year, month, day
    输出: { lunarYear, lunarMonth, lunarDay, isLeap }
    """
    # 1. 基准日：1900年1月31日 = 农历1900年正月初一
    base_solar_date = date(1900, 1, 31)
    base_lunar = (1900, 1, 1)  # 庚子年正月初一
    
    # 2. 计算与基准日的天数差
    target = date(year, month, day)
    offset = (target - base_solar_date).days
    
    # 3. 从1900年开始逐月推算
    lunar_year = 1900
    while offset > 0:
        days_in_year = total_lunar_year_days(lunar_year)
        if offset < days_in_year:
            break
        offset -= days_in_year
        lunar_year += 1
    
    # 4. 推算月份
    leap_month = get_leap_month(lunar_year)
    days_in_month = []
    for m in range(1, 13):
        days_in_month.append(get_month_days(lunar_year, m))
    if leap_month > 0:
        days_in_month.insert(leap_month, get_leap_month_days(lunar_year))
    
    is_leap = False
    lunar_month = 1
    for i, d in enumerate(days_in_month):
        if offset < d:
            lunar_month = i + 1
            if leap_month > 0 and i + 1 > leap_month:
                lunar_month = i    # 闰月处理
                is_leap = (i + 1 == leap_month + 1)
            break
        offset -= d
    
    lunar_day = offset + 1
    return (lunar_year, lunar_month, lunar_day, is_leap)
```

### 1.4 农历年的总天数

```python
def total_lunar_year_days(year):
    """计算农历年的总天数"""
    total = 0
    for m in range(1, 13):
        total += 30 if is_big_month(year, m) else 29
    leap = get_leap_month(year)
    if leap > 0:
        total += 30 if is_leap_big_month(year) else 29
    return total
```

---

## 2. 干支计算

### 2.1 年干支

**公式**：
```
年干索引 = (year - 4) % 10
年支索引 = (year - 4) % 12
```

**示例**：
```
year=2024: 天干=(2024-4)%10=0→甲, 地支=(2024-4)%12=8→申 → 甲辰年
year=2000: 天干=(2000-4)%10=6→庚, 地支=(2000-4)%12=8→辰 → 庚辰年
```

### 2.2 年分界

紫微斗数有两种年分界配置：

| 模式 | 分界 | 说明 |
|------|------|------|
| `normal` | 正月初一 | 以农历春节为年分界（默认） |
| `exact` | 立春 | 以二十四节气的立春为年分界 |

实现时需根据配置选择使用哪种分界方式。立春日期通常在公历 2 月 3-5 日之间。

### 2.3 月干支

月支从寅月开始固定排列：
```
寅月(正月)→寅, 卯月(二月)→卯, ..., 丑月(十二月)→丑
```

**月干**使用 **五虎遁**（年上起月法）：

```python
TIGER_RULE = {
    0: 2,   # 甲/己年 → 丙(索引2)寅月
    1: 4,   # 乙/庚年 → 戊(索引4)寅月
    2: 6,   # 丙/辛年 → 庚(索引6)寅月
    3: 8,   # 丁/壬年 → 壬(索引8)寅月
    4: 0,   # 戊/癸年 → 甲(索引0)寅月
}
# 年干索引: 0=甲,1=乙,2=丙,3=丁,4=戊,5=己,6=庚,7=辛,8=壬,9=癸
# TIGER_RULE 使用年干 % 5 = 0~4 作为 key

def get_month_stem(year_stem_index, month_index):
    """
    year_stem_index: 年干索引 (0~9)
    month_index: 农历月索引 (寅月=0, 卯月=1, ..., 丑月=11)
    """
    base_tiger = TIGER_RULE[year_stem_index % 5]
    return (base_tiger + month_index) % 10
```

### 2.4 日干支

**精确算法**（需要农历库支持）：

```python
def get_day_stem_branch(year, month, day):
    """
    输入: 公历 year, month, day
    输出: (stem_index, branch_index)
    
    使用已知基准日计算:
    2000年1月1日 = 甲午日 (天干索引=0, 地支索引=6)
    """
    base_date = date(2000, 1, 1)
    target = date(year, month, day)
    offset = (target - base_date).days
    
    # 甲子 = 0, 但2000-1-1是甲午=天干0,地支6
    stem = (0 + offset) % 10
    branch = (6 + offset) % 12
    return (stem, branch)
```

**回归公式**（适用于 1900-2100 年，精度较低）：

```
// 计算日干支基数
base = (year - 1900) * 5 + floor((year - 1900) / 4) + 9 + (year - 1900) % 4 * 5
// 加上年内第几天
day_of_year = date(year, month, day) - date(year, 1, 1) + 1
total = base + day_of_year
stem = total % 10
branch = total % 12
```

> **推荐**：日干支计算建议使用查表法或标准农历库，因为回归公式在跨世纪时可能存在偏差。

### 2.5 时干支

**时支**固定（从子时开始）：
```
子时(0/12)→子, 丑时(1)→丑, 寅时(2)→寅, ..., 亥时(11)→亥
```

**时干**使用 **五鼠遁**（日上起时法）：

```python
RAT_RULE = {
    0: 0,   # 甲/己日 → 甲(索引0)子时
    1: 2,   # 乙/庚日 → 丙(索引2)子时
    2: 4,   # 丙/辛日 → 戊(索引4)子时
    3: 6,   # 丁/壬日 → 庚(索引6)子时
    4: 8,   # 戊/癸日 → 壬(索引8)子时
}

def get_hour_stem(day_stem_index, time_index):
    """
    day_stem_index: 日干索引 (0~9)
    time_index: 时辰索引 (0~11, 12=晚子时视为0)
    """
    base_rat = RAT_RULE[day_stem_index % 5]
    return (base_rat + time_index) % 10
```

---

## 3. 时辰索引转换

### 3.1 24 小时制转时辰索引

```python
def hour_to_time_index(hour):
    """将 24 小时制时间转换为时辰索引"""
    if hour == 0:
        return 0        # 00:00~01:00 = 早子时
    if hour == 23:
        return 12       # 23:00~00:00 = 晚子时
    return (hour + 1) // 2  # 其他时辰
```

### 3.2 时辰索引到地支索引

```python
def time_index_to_branch(time_index):
    """时辰索引转地支索引 (0=子, 1=丑, ..., 11=亥)"""
    if time_index == 12 or time_index == 0:
        return 0        # 早子时/晚子时 → 子
    return time_index   # 1→丑, 2→寅, ..., 11→亥
```

---

## 4. 宫位索引与地支索引转换

紫微斗数中，宫位索引与地支索引的对应关系如下：

**宫位索引**从 0 开始对应 **寅**：
```
宫位索引:  0    1    2    3    4    5    6    7    8    9   10   11
对应地支: 寅   卯   辰   巳   午   未   申   酉   戌   亥   子   丑
地支索引:  2    3    4    5    6    7    8    9   10   11    0    1
```

**转换公式**：
```python
def palace_index_to_earthly_branch_index(palace_idx):
    """宫位索引 → 地支索引"""
    return (palace_idx + 2) % 12

def earthly_branch_index_to_palace_index(branch_idx):
    """地支索引 → 宫位索引"""
    return (branch_idx - 2) % 12
```

---

## 5. 索引修正函数

### 5.1 循环索引

```python
def fix_index(index, max_val=12):
    """将索引归约到 [0, max_val-1] 范围"""
    while index < 0:
        index += max_val
    while index >= max_val:
        index -= max_val
    return index if index != -float('inf') else 0
```

### 5.2 闰月索引修正

```python
def fix_lunar_month_index(lunar_month, lunar_day, is_leap, fix_leap):
    """
    将农历月转换为宫位索引（寅月=0）。
    leap month 修正：若 fix_leap=True 且 day > 15，则 month+1
    """
    first_index = earthly_branch_index_to_palace_index(2)  # 寅的宫位索引=0
    
    month_idx = lunar_month - 1      # 正月=0
    month_idx = fix_index(month_idx - first_index)  # 调整为寅月=0
    
    if is_leap and fix_leap and lunar_day > 15:
        month_idx += 1
    
    return fix_index(month_idx)
```

### 5.3 农历日索引修正

```python
def fix_lunar_day_index(lunar_day, time_index):
    """
    处理晚子时的日期修正。
    若 time_index >= 12（晚子时），日期不加 1；否则 day-1
    """
    return lunar_day if time_index >= 12 else lunar_day - 1
```

---

## 6. 支撑函数

### 6.1 地支转宫位索引

```python
def earthly_branch_to_palace_index(branch_name_or_index):
    """
    地支名称或索引 → 宫位索引
    例如: 'yin' → 0, 'zi' → 10
    """
    # 如果是地支名称，先转为索引
    branch_idx = branch_name_to_index(branch_name_or_index)
    return fix_index(branch_idx - 2)  # 寅=2 → 宫位0
```

### 6.2 命宫地支索引

```python
def get_soul_earthly_branch(soul_index):
    """命宫索引 → 命宫地支索引"""
    return (soul_index + 2) % 12
```
