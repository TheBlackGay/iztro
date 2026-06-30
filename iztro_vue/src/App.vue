<template>
  <div class="app">
    <h1 class="title">iztro 紫微斗数 · 本命盘 + 运限流耀叠加</h1>

    <!-- 输入面板 -->
    <div class="panel">
      <div class="row">
        <div class="field"><label>日期</label><input v-model="dateStr" placeholder="2000-8-16" /></div>
        <div class="field">
          <label>时辰</label>
          <select v-model.number="timeIndex">
            <option v-for="(l, i) in hours" :key="i" :value="i">{{ l }}</option>
          </select>
        </div>
        <div class="field"><label>性别</label><select v-model="gender"><option>男</option><option>女</option></select></div>
        <div class="field"><label>流派</label><select v-model="algorithm"><option value="default">全书派</option><option value="zhongzhou">中州派</option></select></div>
        <button @click="onBuild">排盘</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>

    <!-- 运限控制区 -->
    <div v-if="astrolabe" class="panel horo-panel">
      <div class="horo-module">
        <div class="hm-header"><span class="hm-title">大限</span></div>
        <div class="hm-scroll" ref="decScroll" @click="onDecClick"></div>
      </div>
      <div class="horo-module">
        <div class="hm-header"><span class="hm-title">流年</span></div>
        <div class="hm-scroll" ref="yrScroll" @click="onYrClick"></div>
      </div>
      <div class="horo-module">
        <div class="hm-header"><span class="hm-title">流月</span></div>
        <div class="hm-scroll" ref="monScroll" @click="onMonClick"></div>
      </div>
      <div class="horo-module">
        <div class="hm-header"><span class="hm-title">流日</span></div>
        <div class="hm-scroll" ref="dayScroll" @click="onDayClick"></div>
      </div>
      <div class="horo-module">
        <div class="hm-header"><span class="hm-title">流时</span></div>
        <div class="hm-scroll" ref="hrScroll" @click="onHrClick"></div>
      </div>
      <div class="horo-status">{{ horoStatus }}</div>
    </div>

    <!-- 基本信息 -->
    <div v-if="astrolabe" class="panel">
      <table><tbody>
        <tr v-for="[k, v] in basicItems" :key="k"><td class="tlabel">{{ k }}</td><td>{{ v }}</td></tr>
      </tbody></table>
    </div>

    <!-- 4x4 星盘 -->
    <div v-if="astrolabe" class="panel">
      <h2 class="panel-title">紫微斗数星盘</h2>
      <div class="astro-grid" ref="gridRef">
        <template v-for="(pi, idx) in gridSlots" :key="idx">
            <div
              v-if="pi !== null"
              class="palace-card"
              :class="{ 'sfzz-target': sfzzTarget === pi, 'sfzz-highlight': sfzzHighlights.includes(pi) }"
              :data-pi="pi"
              @click="onPalaceClick(pi)"
            >
              <div class="stars-area">
                <div v-for="s in sortedStars(pi)" :key="s.name+s.type" class="star-item">
                  <div class="sn" :style="{color: starColor(s.type)}">{{ s.name }}</div>
                  <div v-if="s.brightness" class="sb">{{ s.brightness }}</div>
                  <div v-if="s.mutagen" class="sm">{{ s.mutagen }}</div>
                </div>
                <span v-if="getStars(pi).length === 0" class="empty-star">—</span>
              </div>
              <div v-if="horoscope && getTransit(pi).length" class="transit-area">
                <span v-for="t in getTransit(pi)" :key="t.scope+t.name" class="ts-item" :class="'ts-'+t.scope">{{ t.name }}</span>
              </div>
              <div v-if="palace(pi)?.decadal" class="decadal-area">
                {{ palace(pi).decadal.range[0] }}-{{ palace(pi).decadal.range[1] }}岁
              </div>
              <div class="deities-area">
                <span v-if="palace(pi)?.boshi12" style="color:#66bb6a">{{ palace(pi).boshi12 }}</span>
                <span v-if="palace(pi)?.jiangqian12">{{ palace(pi).jiangqian12 }}</span>
                <span v-if="palace(pi)?.suiqian12">{{ palace(pi).suiqian12 }}</span>
              </div>
              <div class="name-area">{{ palace(pi)?.name }}</div>
              <div class="stem-area">
                <span v-if="palace(pi)?.changsheng12" class="cs12">{{ palace(pi).changsheng12 }}</span>
                <span class="sb-text">{{ palace(pi)?.heavenlyStem }}{{ palace(pi)?.earthlyBranch }}</span>
              </div>
              <div v-if="palace(pi)?.isBodyPalace && !horoscope" class="body-mark">身宫</div>
            </div>
            <div v-else class="palace-card empty"></div>
          </template>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const hours = ['早子时 00:00~01:00','丑时 01:00~03:00','寅时 03:00~05:00','卯时 05:00~07:00',
  '辰时 07:00~09:00','巳时 09:00~11:00','午时 11:00~13:00','未时 13:00~15:00',
  '申时 15:00~17:00','酉时 17:00~19:00','戌时 19:00~21:00','亥时 21:00~23:00','晚子时 23:00~00:00']

const dateStr = ref('2000-8-16')
const timeIndex = ref(2)
const gender = ref('男')
const algorithm = ref('default')
const error = ref('')
const astrolabe = ref(null)
const horoscope = ref(null)
const horoStatus = ref('')
const sfzzTarget = ref(-1)

const selDec = ref(0), selYr = ref(0), selMon = ref(0), selDay = ref(0), selHr = ref(0)
const decScroll = ref(null), yrScroll = ref(null), monScroll = ref(null), dayScroll = ref(null), hrScroll = ref(null)
const gridRef = ref(null)

const basicItems = computed(() => {
  const a = astrolabe.value
  if (!a) return []
  return [
    ['阳历', a.solarDate], ['农历', a.lunarDate], ['四柱', a.chineseDate],
    ['时辰', a.time], ['生肖', a.zodiac], ['星座', a.sign],
    ['命宫', a.earthlyBranchOfSoulPalace], ['身宫', a.earthlyBranchOfBodyPalace],
    ['命主', a.soul], ['身主', a.body], ['五行局', a.fiveElementsClass],
  ]
})

const gridSlots = computed(() => {
  const s = Array(16).fill(null)
  const map = [12,8,4,0, 1,2,3,7, 11,15,14,13]
  for (let i = 0; i < 12; i++) s[map[i]] = i
  return s
})

const sfzzHighlights = computed(() => {
  if (sfzzTarget.value < 0) return []
  const t = sfzzTarget.value
  return [t, (t+6)%12, (t+4)%12, (t+8)%12]
})

function palace(pi) { return astrolabe.value?.palaces?.[pi] }
function getStars(pi) {
  const p = palace(pi)
  if (!p) return []
  return [...(p.majorStars||[]), ...(p.minorStars||[]), ...(p.adjectiveStars||[])]
}
function sortedStars(pi) {
  const order = ['major','soft','lucun','tianma','tough','adjective','flower','helper']
  const all = getStars(pi)
  const r = []
  order.forEach(t => all.filter(s => s.type === t).forEach(s => r.push(s)))
  return r
}
const starColors = { major:'#c0392b', soft:'#27ae60', lucun:'#27ae60', tianma:'#27ae60', tough:'#e67e22', adjective:'#7f8c8d', flower:'#7f8c8d', helper:'#7f8c8d' }
function starColor(t) { return starColors[t] || '#888' }

function getTransit(pi) {
  if (!horoscope.value) return []
  const r = []
  const scopes = ['decadal','yearly','monthly','daily','hourly']
  scopes.forEach(s => {
    const item = horoscope.value[s]
    if (item?.stars?.[pi]) item.stars[pi].forEach(st => r.push({ scope: s, name: st.name }))
  })
  return r
}

function onBuild() {
  error.value = ''
  horoscope.value = null
  sfzzTarget.value = -1
  horoStatus.value = ''
  try {
    const a = window.iztro.astro.bySolar(dateStr.value, timeIndex.value, gender.value)
    if (algorithm.value === 'zhongzhou') {
      astrolabe.value = window.iztro.astro.withOptions({
        type:'solar', dateStr:dateStr.value, timeIndex:timeIndex.value, gender:gender.value,
        config:{algorithm:'zhongzhou'}, astroType:'heaven',
      })
    } else {
      astrolabe.value = a
    }
    selDec.value = 0; selYr.value = 0; selMon.value = 0; selDay.value = 0; selHr.value = 0
    nextTick(() => {
      refreshHoroscope()
      const soul = astrolabe.value.palace('命宫')
      if (soul) sfzzTarget.value = soul.index
    })
  } catch (e) { error.value = e.message }
}

function getDecadals() {
  if (!astrolabe.value) return []
  const list = []
  astrolabe.value.palaces.forEach(p => { if (p.decadal) list.push(p.decadal) })
  list.sort((a, b) => a.range[0] - b.range[0])
  return list
}

function refreshHoroscope() {
  if (!astrolabe.value) return
  const allDecs = getDecadals()
  const dec = allDecs[Math.min(selDec.value, allDecs.length-1)]
  if (!dec) return
  const birthYear = parseInt(astrolabe.value.solarDate.split('-')[0])
  const age = dec.range[0] + selYr.value
  const year = birthYear + age - 1
  const mon = Math.min(selMon.value + 1, 12)
  const day = Math.min(selDay.value + 1, new Date(year, mon, 0).getDate())
  const dateStr2 = `${year}-${mon}-${day}`
  try {
    const h = astrolabe.value.horoscope(dateStr2, selHr.value)
    horoscope.value = h
    horoStatus.value = `📅 ${dateStr2} · 大限: ${dec.range[0]}-${dec.range[1]}岁 · 流年: ${year}年`
    const ys = (y) => '甲乙丙丁戊己庚辛壬癸'[(y-4)%10] + '子丑寅卯辰巳午未申酉戌亥'[(y-4)%12]
    if (decScroll.value) {
      decScroll.value.innerHTML = allDecs.map((d,i) =>
        `<div class="hm-cell ${i===selDec.value?'active':''}" data-idx="${i}">
          <div class="hm-main">${d.range[0]}-${d.range[1]}</div>
          <div class="hm-sub">${d.heavenlyStem}${d.earthlyBranch}限</div>
        </div>`).join('')
    }
    if (yrScroll.value) {
      let html = ''
      for (let a = dec.range[0]; a <= dec.range[1]; a++) {
        const y = birthYear + a - 1, act = a === dec.range[0]+selYr.value ? 'active' : ''
        html += `<div class="hm-cell ${act}" data-idx="${a-dec.range[0]}">
          <div class="hm-main">${y}</div>
          <div class="hm-sub">${ys(y)} ${a}岁</div>
        </div>`
      }
      yrScroll.value.innerHTML = html
    }
    if (monScroll.value) {
      const mnames = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月']
      monScroll.value.innerHTML = mnames.map((n,i) =>
        `<div class="hm-cell ${i===selMon.value?'active':''}" data-idx="${i}">
          <div class="hm-main">${n}</div>
        </div>`).join('')
    }
    if (dayScroll.value) {
      const dc = new Date(year, mon, 0).getDate()
      let html = ''
      for (let i = 0; i < dc; i++) {
        html += `<div class="hm-cell ${i===selDay.value?'active':''}" data-idx="${i}">
          <div class="hm-main">${i+1}</div>
        </div>`
      }
      dayScroll.value.innerHTML = html
    }
    if (hrScroll.value) {
      hrScroll.value.innerHTML = hours.map((n,i) =>
        `<div class="hm-cell ${i===selHr.value?'active':''}" data-idx="${i}">
          <div class="hm-main">${n.split(' ')[0]}</div>
        </div>`).join('')
    }
  } catch(e) { horoStatus.value = '❌ ' + e.message }
}

function onDecClick(e) {
  const cell = e.target.closest('[data-idx]')
  if (!cell) return
  selDec.value = parseInt(cell.dataset.idx); selYr.value = 0; selMon.value = 0; selDay.value = 0
  refreshHoroscope()
  if (horoscope.value) sfzzTarget.value = horoscope.value.decadal.index
}
function onYrClick(e) {
  const cell = e.target.closest('[data-idx]')
  if (!cell) return
  selYr.value = parseInt(cell.dataset.idx); selMon.value = 0; selDay.value = 0
  refreshHoroscope()
  if (horoscope.value) {
    const br = horoscope.value.yearly.earthlyBranch
    const target = astrolabe.value?.palaces.find(p => p.earthlyBranch === br)
    if (target) sfzzTarget.value = target.index
  }
}
function onMonClick(e) {
  const cell = e.target.closest('[data-idx]')
  if (!cell) return
  selMon.value = parseInt(cell.dataset.idx); selDay.value = 0
  refreshHoroscope()
}
function onDayClick(e) {
  const cell = e.target.closest('[data-idx]')
  if (!cell) return
  selDay.value = parseInt(cell.dataset.idx)
  refreshHoroscope()
}
function onHrClick(e) {
  const cell = e.target.closest('[data-idx]')
  if (!cell) return
  selHr.value = parseInt(cell.dataset.idx)
  refreshHoroscope()
}

// ========== 三方四正 SVG ==========
function getSvg() {
  let svg = document.getElementById('sfzz-svg')
  if (!svg && gridRef.value) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = 'sfzz-svg'
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10'
    gridRef.value.appendChild(svg)
  }
  return svg
}

function drawSfzz(pi) {
  const grid = gridRef.value
  if (!grid) { setTimeout(() => drawSfzz(pi), 100); return }
  const svg = getSvg()
  if (!svg) return
  const rect = grid.getBoundingClientRect()
  svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`)
  const pts = [pi, (pi+6)%12, (pi+4)%12, (pi+8)%12].map(i => {
    const layout = {0:[3,0],1:[2,0],2:[1,0],3:[0,0],4:[0,1],5:[0,2],6:[0,3],7:[1,3],8:[2,3],9:[3,3],10:[3,2],11:[3,1]}
    const [r, c] = layout[i] || [0,0]
    const w = rect.width/4, h = rect.height/4
    if (r===0&&c===0) return {x:(c+1)*w, y:(r+1)*h}
    if (r===0&&c===3) return {x:c*w, y:(r+1)*h}
    if (r===3&&c===3) return {x:c*w, y:r*h}
    if (r===3&&c===0) return {x:(c+1)*w, y:r*h}
    if (r===0) return {x:(c+0.5)*w, y:(r+1)*h}
    if (c===3) return {x:c*w, y:(r+0.5)*h}
    if (r===3) return {x:(c+0.5)*w, y:r*h}
    if (c===0) return {x:(c+1)*w, y:(r+0.5)*h}
    return {x:(c+0.5)*w, y:(r+0.5)*h}
  })
  svg.innerHTML = ''
  [[0,2],[2,3],[0,3],[0,1]].forEach(([f,t]) => {
    const l = document.createElementNS('http://www.w3.org/2000/svg','line')
    l.setAttribute('x1', pts[f].x); l.setAttribute('y1', pts[f].y)
    l.setAttribute('x2', pts[t].x); l.setAttribute('y2', pts[t].y)
    l.setAttribute('stroke','#e67e22'); l.setAttribute('stroke-width','2')
    l.setAttribute('stroke-dasharray','5,3'); l.setAttribute('stroke-opacity','0.7')
    svg.appendChild(l)
  })
}

function clearSfzz() {
  const s = document.getElementById('sfzz-svg')
  if (s) s.innerHTML = ''
}

function onPalaceClick(pi) {
  if (sfzzTarget.value === pi) { sfzzTarget.value = -1; clearSfzz() }
  else { sfzzTarget.value = pi; drawSfzz(pi) }
}

watch(sfzzTarget, (val) => {
  if (val >= 0) setTimeout(() => drawSfzz(val), 100)
  else clearSfzz()
})

let resizeTimer
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => { if (sfzzTarget.value>=0) drawSfzz(sfzzTarget.value) }, 300)
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system,'PingFang SC','Microsoft YaHei',sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
.app { max-width: 1300px; margin: 0 auto; }
.title { text-align: center; margin-bottom: 20px; font-size: 22px; }
.panel { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.panel-title { font-size: 16px; margin-bottom: 12px; text-align: center; }
.row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
.field { display: flex; flex-direction: column; gap: 4px; }
.field label { font-size: 13px; color: #666; }
.field input, .field select { padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; min-width: 130px; }
.field input:focus, .field select:focus { outline: none; border-color: #4a90d9; }
button { padding: 8px 24px; background: #4a90d9; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
button:hover { background: #357abd; }
.error { color: #e74c3c; padding: 8px 0; }

table { width: 100%; border-collapse: collapse; font-size: 13px; }
td, th { padding: 5px 8px; border: 1px solid #eee; }
.tlabel { width: 80px; font-weight: 600; color: #555; }

.horo-panel { margin-bottom: 20px; }
.horo-module { margin-bottom: 6px; }
.hm-header { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
.hm-title { font-size: 12px; font-weight: 700; color: #555; min-width: 32px; }
.hm-scroll { display: flex; gap: 3px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: thin; }
.hm-scroll::-webkit-scrollbar { height: 3px; }
.hm-scroll::-webkit-scrollbar-thumb { background: #ccc; border-radius: 2px; }
.hm-cell { flex-shrink: 0; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px; padding: 3px 8px; text-align: center; cursor: pointer; user-select: none; min-width: 48px; transition: background .15s; }
.hm-cell:hover { background: #eee; }
.hm-cell.active { background: #c0392b; color: #fff; border-color: #c0392b; }
.hm-cell .hm-main { font-size: 12px; font-weight: 600; line-height: 1.4; }
.hm-cell .hm-sub { font-size: 9px; color: #888; line-height: 1.2; }
.hm-cell.active .hm-sub { color: #fcc; }
.horo-status { font-size: 12px; color: #666; margin-top: 4px; }

.astro-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid #bbb; position: relative; aspect-ratio: 1; max-width: 860px; margin: 0 auto; }
.palace-card { background: #fafafa; outline: 1px solid #bbb; padding: 3px; font-size: 10px; display: grid; grid-template-rows: 1fr auto auto auto; grid-template-columns: 1fr 1fr 1fr; gap: 1px 0; position: relative; cursor: pointer; }
.palace-card.sfzz-target { background: #fff3cd; outline: 3px solid #d35400; z-index: 3; }
.palace-card.sfzz-highlight { background: #fff8e1; outline: 2px solid #e67e22; z-index: 2; }
.palace-card.empty { background: transparent; outline: none; pointer-events: none; }

.stars-area { grid-column: 1/4; display: flex; flex-wrap: wrap; align-items: flex-start; align-content: flex-start; gap: 2px 4px; padding: 1px 0; min-height: 0; }
.star-item { display: flex; flex-direction: column; align-items: center; line-height: 1.1; min-width: 14px; }
.star-item .sn { font-size: 10px; font-weight: 600; writing-mode: vertical-lr; letter-spacing: 0; }
.star-item .sb { font-size: 8px; color: #888; line-height: 1; margin-top: 1px; }
.star-item .sm { font-size: 7px; color: #fff; background: #c0392b; border-radius: 2px; padding: 0 2px; line-height: 1.3; margin-top: 1px; }
.empty-star { color: #ccc; font-size: 8px; }

.transit-area { position: absolute; right: 2px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: row-reverse; align-items: flex-start; gap: 2px; z-index: 1; }
.ts-item { font-size: 8px; font-weight: 600; writing-mode: vertical-lr; letter-spacing: 0; line-height: 1.1; }
.ts-decadal { color: #c55a11; }
.ts-yearly  { color: #2e75b6; }
.ts-monthly { color: #548235; }
.ts-daily   { color: #bf8f00; }
.ts-hourly  { color: #843c0c; }

.decadal-area { grid-column: 1/4; text-align: center; font-size: 9px; color: #666; padding: 1px 0; border-top: 1px dotted #ddd; border-bottom: 1px dotted #ddd; }

.deities-area { grid-column: 1; align-self: end; display: flex; flex-direction: column; font-size: 8px; color: #777; line-height: 1.3; padding: 1px; overflow: hidden; }
.name-area { grid-column: 2; align-self: end; display: flex; align-items: flex-end; justify-content: center; font-weight: 700; font-size: 13px; color: #c0392b; padding-bottom: 1px; }
.stem-area { grid-column: 3; align-self: end; display: flex; flex-direction: column; align-items: flex-end; writing-mode: vertical-lr; line-height: 1; padding: 0; margin: 0 -3px -3px 0; gap: 0; }
.stem-area .cs12 { font-size: 8px; color: #888; }
.stem-area .sb-text { font-size: 11px; color: #555; letter-spacing: 1px; }

.body-mark { position: absolute; right: 2px; top: 50%; transform: translateY(-50%); font-size: 9px; color: #c0392b; background: #fff; border: 1px solid #c0392b; border-radius: 4px; font-weight: 600; writing-mode: vertical-lr; letter-spacing: 1px; line-height: 1.2; padding: 2px 1px; z-index: 2; }
</style>
