/** 紫微斗数四化 */
export const MUTAGEN = ['sihuaLu', 'sihuaQuan', 'sihuaKe', 'sihuaJi'] as const;

/**
 * 星耀信息
 * 其中包含：
 * 1. 亮度（bright）, 按照宫位地支排序（从寅开始）
 * 2. 五行（fiveElements）
 * 3. 阴阳（yinYang）
 */
export const STARS_INFO = {
  ziweiMaj: {
    brightness: ['wang', 'wang', 'de', 'wang', 'miao', 'miao', 'wang', 'wang', 'de', 'wang', 'ping', 'miao'],
    fiveElements: '土',
    yinYang: '阴',
  },
  tianjiMaj: {
    brightness: ['de', 'wang', 'li', 'ping', 'miao', 'xian', 'de', 'wang', 'li', 'ping', 'miao', 'xian'],
    fiveElements: '木',
    yinYang: '阴',
  },
  taiyangMaj: {
    brightness: ['wang', 'miao', 'wang', 'wang', 'wang', 'de', 'de', 'xian', 'bu', 'xian', 'xian', 'bu'],
    fiveElements: '',
    yinYang: '',
  },
  wuquMaj: {
    brightness: ['de', 'li', 'miao', 'ping', 'wang', 'miao', 'de', 'li', 'miao', 'ping', 'wang', 'miao'],
    fiveElements: '金',
    yinYang: '阴',
  },
  tiantongMaj: {
    brightness: ['li', 'ping', 'ping', 'miao', 'xian', 'bu', 'wang', 'ping', 'ping', 'miao', 'wang', 'bu'],
    fiveElements: '水',
    yinYang: '阳',
  },
  lianzhenMaj: {
    brightness: ['miao', 'ping', 'li', 'xian', 'ping', 'li', 'miao', 'ping', 'li', 'xian', 'ping', 'li'],
    fiveElements: '火',
    yinYang: '阴',
  },
  tianfuMaj: {
    brightness: ['miao', 'de', 'miao', 'de', 'wang', 'miao', 'de', 'wang', 'miao', 'de', 'miao', 'miao'],
    fiveElements: '土',
    yinYang: '阳',
  },
  taiyinMaj: {
    brightness: ['wang', 'xian', 'xian', 'xian', 'bu', 'bu', 'li', 'bu', 'wang', 'miao', 'miao', 'miao'],
    fiveElements: '水',
    yinYang: '阴',
  },
  tanlangMaj: {
    brightness: ['ping', 'li', 'miao', 'xian', 'wang', 'miao', 'ping', 'li', 'miao', 'xian', 'wang', 'miao'],
    fiveElements: '水',
    yinYang: '',
  },
  jumenMaj: {
    brightness: ['miao', 'miao', 'xian', 'wang', 'wang', 'bu', 'miao', 'miao', 'xian', 'wang', 'wang', 'bu'],
    fiveElements: '土',
    yinYang: '阴',
  },
  tianxiangMaj: {
    brightness: ['miao', 'xian', 'de', 'de', 'miao', 'de', 'miao', 'xian', 'de', 'de', 'miao', 'miao'],
    fiveElements: '水',
    yinYang: '',
  },
  tianliangMaj: {
    brightness: ['miao', 'miao', 'miao', 'xian', 'miao', 'wang', 'xian', 'de', 'miao', 'xian', 'miao', 'wang'],
    fiveElements: '土',
    yinYang: '',
  },
  qishaMaj: {
    brightness: ['miao', 'wang', 'miao', 'ping', 'wang', 'miao', 'miao', 'miao', 'miao', 'ping', 'wang', 'miao'],
    fiveElements: '',
    yinYang: '',
  },
  pojunMaj: {
    brightness: ['de', 'xian', 'wang', 'ping', 'miao', 'wang', 'de', 'xian', 'wang', 'ping', 'miao', 'wang'],
    fiveElements: '水',
    yinYang: '',
  },
  // wenchangMin: {
  //   brightness: ['xian', 'li', 'de', 'miao', 'xian', 'li', 'de', 'miao', 'xian', 'li', 'de', 'miao'],
  // },
  // wenquMin: {
  //   brightness: ['ping', 'wang', 'de', 'miao', 'xian', 'wang', 'de', 'miao', 'xian', 'wang', 'de', 'miao'],
  // },
  // huoxingMin: {
  //   brightness: ['miao', 'li', 'xian', 'de', 'miao', 'li', 'xian', 'de', 'miao', 'li', 'xian', 'de'],
  // },
  // lingxingMin: {
  //   brightness: ['miao', 'li', 'xian', 'de', 'miao', 'li', 'xian', 'de', 'miao', 'li', 'xian', 'de'],
  // },
  // qingyangMin: {
  //   brightness: ['', 'xian', 'miao', '', 'xian', 'miao', '', 'xian', 'miao', '', 'xian', 'miao'],
  // },
  // tuoluoMin: {
  //   brightness: ['xian', '', 'miao', 'xian', '', 'miao', 'xian', '', 'miao', 'xian', '', 'miao'],
  // },
  wenchangMin: { brightness: ['xian', 'li', 'de', 'miao', 'xian', 'li', 'de', 'miao', 'xian', 'li', 'de', 'miao'] },
  wenquMin: { brightness: ['ping', 'wang', 'de', 'miao', 'xian', 'wang', 'de', 'miao', 'xian', 'wang', 'de', 'miao'] },
  huoxingMin: { brightness: ['miao', 'li', 'xian', 'de', 'miao', 'li', 'xian', 'de', 'miao', 'li', 'xian', 'de'] },
  lingxingMin: { brightness: ['miao', 'li', 'xian', 'de', 'miao', 'li', 'xian', 'de', 'miao', 'li', 'xian', 'de'] },
  qingyangMin: { brightness: ['', 'xian', 'miao', '', 'xian', 'miao', '', 'xian', 'miao', '', 'xian', 'miao'] },
  tuoluoMin: { brightness: ['xian', '', 'miao', 'xian', '', 'miao', 'xian', '', 'miao', 'xian', '', 'miao'] },
  zuofuMin: {
    brightness: ['miao', 'xian', 'miao', 'ping', 'wang', 'miao', 'ping', 'xian', 'miao', 'bu', 'de', 'miao'],
  },
  youbiMin: {
    brightness: ['wang', 'xian', 'miao', 'ping', 'wang', 'miao', 'bu', 'xian', 'miao', 'ping', 'miao', 'miao'],
  },
  tiankuiMin: { brightness: ['', 'miao', '', '', '', '', '', '', '', 'wang', 'wang', 'wang'] },
  tianyueMin: { brightness: ['', '', '', 'wang', '', 'wang', 'miao', 'miao', '', '', '', ''] },
  dikongMin: {
    brightness: ['xian', 'ping', 'xian', 'miao', 'miao', 'ping', 'miao', 'miao', 'xian', 'xian', 'ping', 'xian'],
  },
  dijieMin: { brightness: ['ping', 'ping', 'xian', 'bu', 'miao', 'ping', 'miao', 'ping', 'ping', '', 'xian', 'xian'] },
  tianmaMin: { brightness: ['wang', '', '', 'ping', '', '', 'wang', '', '', 'ping', '', ''] },
  lucunMin: { brightness: ['miao', 'miao', '', 'miao', 'miao', '', 'miao', 'miao', '', 'miao', 'miao', ''] },
  guchen: { brightness: ['ping', '', '', 'xian', '', '', 'ping', '', '', 'xian', '', ''] },
  guasu: { brightness: ['', '', 'xian', '', '', 'bu', '', '', 'xian', '', '', 'ping'] },
  tianxing: {
    brightness: ['miao', 'miao', 'ping', 'xian', 'ping', 'xian', 'xian', 'miao', 'miao', 'xian', 'ping', 'xian'],
  },
  tianyao: {
    brightness: ['wang', 'miao', 'xian', 'ping', 'ping', 'wang', 'xian', 'miao', 'miao', 'xian', 'xian', 'ping'],
  },
  engguang: {
    brightness: ['ping', 'miao', 'miao', 'ping', 'miao', 'wang', 'ping', 'xian', 'miao', 'bu', 'ping', 'miao'],
  },
  tiangui: {
    brightness: ['ping', 'wang', 'wang', 'ping', 'miao', 'wang', 'xian', 'miao', 'wang', 'ping', 'miao', 'wang'],
  },
  posui: { brightness: ['', '', '', 'xian', '', '', '', 'ping', '', '', '', 'xian'] },
  feilian: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  hongluan: {
    brightness: ['wang', 'miao', 'miao', 'wang', 'wang', 'xian', 'miao', 'wang', 'xian', 'miao', 'miao', 'xian'],
  },
  tianxi: {
    brightness: ['miao', 'wang', 'xian', 'miao', 'miao', 'xian', 'wang', 'miao', 'xian', 'wang', 'wang', 'xian'],
  },
  longchi: {
    brightness: ['ping', 'miao', 'miao', 'xian', 'bu', 'miao', 'ping', 'miao', 'xian', 'wang', 'wang', 'ping'],
  },
  fengge: {
    brightness: ['miao', 'wang', 'xian', 'miao', 'ping', 'xian', 'bu', 'miao', 'miao', 'wang', 'miao', 'ping'],
  },
  tianshang: {
    brightness: ['ping', 'xian', 'ping', 'ping', 'xian', 'xian', 'ping', 'ping', 'ping', 'wang', 'xian', 'ping'],
  },
  tianshi: {
    brightness: ['ping', 'ping', 'xian', 'ping', 'ping', 'ping', 'ping', 'xian', 'xian', 'wang', 'xian', 'xian'],
  },
  santai: {
    brightness: ['ping', 'xian', 'miao', 'ping', 'wang', 'miao', 'wang', 'miao', 'wang', 'ping', 'ping', 'miao'],
  },
  bazuo: {
    brightness: ['miao', 'ping', 'wang', 'miao', 'wang', 'ping', 'miao', 'miao', 'ping', 'miao', 'xian', 'miao'],
  },
  tianguan: { brightness: ['ping', 'wang', 'wang', 'wang', 'miao', 'miao', '', 'ping', 'ping', 'wang', '', ''] },
  tianfu: { brightness: ['wang', 'ping', '', 'wang', 'ping', '', 'miao', 'miao', '', 'miao', 'ping', ''] },
  tianku: { brightness: ['ping', 'miao', 'ping', 'bu', 'xian', 'ping', 'miao', 'bu', 'ping', 'ping', 'ping', 'miao'] },
  tianxu: {
    brightness: ['wang', 'miao', 'xian', 'wang', 'ping', 'xian', 'miao', 'wang', 'xian', 'ping', 'xian', 'miao'],
  },
  tiancai: {
    brightness: ['miao', 'wang', 'xian', 'miao', 'wang', 'ping', 'miao', 'wang', 'xian', 'miao', 'wang', 'ping'],
  },
  tianshou: {
    brightness: ['wang', 'xian', 'miao', 'ping', 'ping', 'wang', 'wang', 'ping', 'miao', 'wang', 'ping', 'miao'],
  },
  taifu: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  fenggao: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  xianchi: { brightness: ['', 'ping', '', '', 'xian', '', '', 'ping', '', '', 'xian', ''] },
  tianchu: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  huagai: { brightness: ['', '', 'miao', '', '', 'xian', '', '', 'ping', '', '', 'xian'] },
  yinsha: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  jieshen: { brightness: ['miao', '', 'miao', '', 'miao', '', 'bu', '', 'miao', '', 'miao', ''] },
  tiande: {
    brightness: ['ping', 'ping', 'miao', 'wang', 'wang', 'miao', 'ping', 'bu', 'miao', 'ping', 'miao', 'miao'],
  },
  yuede: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  tianyue: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  tianwu: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  tiankong: {
    brightness: ['xian', 'ping', 'miao', 'miao', 'miao', 'xian', 'wang', 'wang', 'xian', 'ping', 'xian', 'ping'],
  },
  xunkong: { brightness: ['', '', '', '', '', '', 'miao', 'miao', 'xian', 'ping', '', ''] },
  jiekong: { brightness: ['xian', 'ping', 'xian', 'miao', 'miao', 'miao', 'miao', 'miao', '', '', 'xian', 'bu'] },
  longde: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  dahao: { brightness: ['xian', 'bu', 'ping', 'xian', 'wang', 'ping', 'xian', 'bu', 'ping', 'xian', 'wang', 'ping'] },
  jiesha: { brightness: ['', '', '', '', '', '', '', '', '', '', '', ''] },
  nianjie: { brightness: ['miao', 'miao', 'miao', 'wang', 'miao', 'de', 'li', 'wang', 'miao', 'de', 'miao', 'de'] },
} as const;
