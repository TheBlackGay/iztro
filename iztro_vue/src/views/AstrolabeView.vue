<template>
  <div class="astro-view">
    <div class="view-header">
      <button class="back-btn" @click="$emit('back')">〈 返回</button>
      <span class="view-title">紫微斗数星盘</span>
      <span class="view-name" v-if="record">{{ record.name }}</span>
    </div>

    <!-- 输入面板 -->
    <div class="panel">
      <div class="row">
        <div class="field"><label>日期</label><input v-model="dateStr" /></div>
        <div class="field">
          <label>时辰</label>
          <select v-model.number="timeIndex">
            <option v-for="(l,i) in hours" :key="i" :value="i">{{ l }}</option>
          </select>
        </div>
        <div class="field"><label>性别</label><select v-model="gender"><option>男</option><option>女</option></select></div>
        <button @click="onBuild">排盘</button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>

    <template v-if="astrolabe">
      <div class="panel horo-panel">
        <div class="horo-module"><div class="hm-header"><span class="hm-title">大限</span></div><div class="hm-scroll" ref="decScroll" @click="onDecClick"></div></div>
        <div class="horo-module"><div class="hm-header"><span class="hm-title">流年</span></div><div class="hm-scroll" ref="yrScroll" @click="onYrClick"></div></div>
        <div class="horo-module"><div class="hm-header"><span class="hm-title">流月</span></div><div class="hm-scroll" ref="monScroll" @click="onMonClick"></div></div>
        <div class="horo-module"><div class="hm-header"><span class="hm-title">流日</span></div><div class="hm-scroll" ref="dayScroll" @click="onDayClick"></div></div>
        <div class="horo-module"><div class="hm-header"><span class="hm-title">流时</span></div><div class="hm-scroll" ref="hrScroll" @click="onHrClick"></div></div>
        <div class="horo-status">{{ horoStatus }}</div>
      </div>

      <div class="panel"><table><tbody>
        <tr v-for="[k,v] in basicItems" :key="k"><td class="tlabel">{{ k }}</td><td>{{ v }}</td></tr>
      </tbody></table></div>

      <div class="panel">
        <div class="astro-grid" ref="gridRef">
          <template v-for="(pi, idx) in gridSlots" :key="idx">
            <div v-if="pi!==null" class="palace-card" :class="{'sfzz-target':sfzzTarget===pi,'sfzz-highlight':sfzzHighlights.includes(pi)}" :data-pi="pi" @click="onPalaceClick(pi)">
              <div class="stars-area">
                <div v-for="s in sortedStars(pi)" :key="s.name+s.type" class="star-item"><div class="sn" :style="{color:starColor(s.type)}">{{ s.name }}</div><div v-if="s.brightness" class="sb">{{ s.brightness }}</div><div v-if="s.mutagen" class="sm">{{ s.mutagen }}</div></div>
                <span v-if="getStars(pi).length===0" class="empty-star">—</span>
              </div>
              <div v-if="horoscope && getTransit(pi).length" class="transit-area"><span v-for="t in getTransit(pi)" :key="t.scope+t.name" class="ts-item" :class="'ts-'+t.scope">{{ t.name }}</span></div>
              <div v-if="palace(pi)?.decadal" class="decadal-area">{{ palace(pi).decadal.range[0] }}-{{ palace(pi).decadal.range[1] }}岁</div>
              <div class="deities-area"><span v-if="palace(pi)?.boshi12" style="color:#66bb6a">{{ palace(pi).boshi12 }}</span><span v-if="palace(pi)?.jiangqian12">{{ palace(pi).jiangqian12 }}</span><span v-if="palace(pi)?.suiqian12">{{ palace(pi).suiqian12 }}</span></div>
              <div class="name-area">{{ palace(pi)?.name }}</div>
              <div class="stem-area"><span v-if="palace(pi)?.changsheng12" class="cs12">{{ palace(pi).changsheng12 }}</span><span class="sb-text">{{ palace(pi)?.heavenlyStem }}{{ palace(pi)?.earthlyBranch }}</span></div>
              <div v-if="palace(pi)?.isBodyPalace && !horoscope" class="body-mark">身宫</div>
            </div>
            <div v-else class="palace-card empty"></div>
          </template>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import * as db from '../services/db.js'

const props = defineProps({ record: Object })
const emit = defineEmits(['back'])

const hours = ['早子时 00:00~01:00','丑时 01:00~03:00','寅时 03:00~05:00','卯时 05:00~07:00','辰时 07:00~09:00','巳时 09:00~11:00','午时 11:00~13:00','未时 13:00~15:00','申时 15:00~17:00','酉时 17:00~19:00','戌时 19:00~21:00','亥时 21:00~23:00','晚子时 23:00~00:00']

const dateStr = ref(props.record?.birthDate || '2000-8-16')
const timeIndex = ref(props.record?.birthHour ?? 2)
const gender = ref(props.record?.gender || '男')
const error = ref('')
const astrolabe = ref(null)
const horoscope = ref(null)
const horoStatus = ref('')
const sfzzTarget = ref(-1)
const selDec = ref(0), selYr = ref(0), selMon = ref(0), selDay = ref(0), selHr = ref(0)
const decScroll = ref(null), yrScroll = ref(null), monScroll = ref(null), dayScroll = ref(null), hrScroll = ref(null)
const gridRef = ref(null)

const basicItems = computed(() => {
  const a = astrolabe.value; if (!a) return []
  return [['阳历',a.solarDate],['农历',a.lunarDate],['四柱',a.chineseDate],['时辰',a.time],['生肖',a.zodiac],['星座',a.sign],['命宫',a.earthlyBranchOfSoulPalace],['身宫',a.earthlyBranchOfBodyPalace],['命主',a.soul],['身主',a.body],['五行局',a.fiveElementsClass]]
})

const gridSlots = computed(() => { const s=Array(16).fill(null); const m=[12,8,4,0,1,2,3,7,11,15,14,13]; for(let i=0;i<12;i++) s[m[i]]=i; return s })
const sfzzHighlights = computed(() => { if(sfzzTarget.value<0) return []; const t=sfzzTarget.value; return [t,(t+6)%12,(t+4)%12,(t+8)%12] })

function palace(pi) { return astrolabe.value?.palaces?.[pi] }
function getStars(pi) { const p=palace(pi); if(!p) return []; return [...(p.majorStars||[]),...(p.minorStars||[]),...(p.adjectiveStars||[])] }
function sortedStars(pi) { const o=['major','soft','lucun','tianma','tough','adjective','flower','helper']; const a=getStars(pi),r=[]; o.forEach(t=>a.filter(s=>s.type===t).forEach(s=>r.push(s))); return r }
const sc={major:'#c0392b',soft:'#27ae60',lucun:'#27ae60',tianma:'#27ae60',tough:'#e67e22',adjective:'#7f8c8d',flower:'#7f8c8d',helper:'#7f8c8d'}
function starColor(t) { return sc[t]||'#888' }
function getTransit(pi) { if(!horoscope.value) return []; const r=[]; ['decadal','yearly','monthly','daily','hourly'].forEach(s=>{const i=horoscope.value[s]; if(i?.stars?.[pi]) i.stars[pi].forEach(st=>r.push({scope:s,name:st.name}))}); return r }

function onBuild() {
  error.value=''; horoscope.value=null; sfzzTarget.value=-1; horoStatus.value=''
  try {
    const a=window.iztro.astro.bySolar(dateStr.value,timeIndex.value,gender.value)
    astrolabe.value=a
    selDec.value=0; selYr.value=0; selMon.value=0; selDay.value=0; selHr.value=0
    nextTick(()=>{refreshHoroscope(); const s=astrolabe.value.palace('命宫'); if(s) sfzzTarget.value=s.index})
  } catch(e) { error.value=e.message }
}

function getDecadals() { if(!astrolabe.value) return []; const l=[]; astrolabe.value.palaces.forEach(p=>{if(p.decadal) l.push(p.decadal)}); l.sort((a,b)=>a.range[0]-b.range[0]); return l }
function refreshHoroscope() {
  if(!astrolabe.value) return
  const ad=getDecadals(), dec=ad[Math.min(selDec.value,ad.length-1)]; if(!dec) return
  const by=parseInt(astrolabe.value.solarDate.split('-')[0]), age=dec.range[0]+selYr.value, yr=by+age-1, mon=Math.min(selMon.value+1,12), day=Math.min(selDay.value+1,new Date(yr,mon,0).getDate())
  const ds=`${yr}-${mon}-${day}`
  try {
    const h=astrolabe.value.horoscope(ds,selHr.value); horoscope.value=h; horoStatus.value=`📅 ${ds} · 大限: ${dec.range[0]}-${dec.range[1]}岁 · 流年: ${yr}年`
    const ys=(y)=>'甲乙丙丁戊己庚辛壬癸'[(y-4)%10]+'子丑寅卯辰巳午未申酉戌亥'[(y-4)%12]
    if(decScroll.value) decScroll.value.innerHTML=ad.map((d,i)=>`<div class="hm-cell ${i===selDec.value?'active':''}" data-idx="${i}"><div class="hm-main">${d.range[0]}-${d.range[1]}</div><div class="hm-sub">${d.heavenlyStem}${d.earthlyBranch}限</div></div>`).join('')
    if(yrScroll.value){let h='';for(let a=dec.range[0];a<=dec.range[1];a++){const y=by+a-1,act=a===dec.range[0]+selYr.value?'active':'';h+=`<div class="hm-cell ${act}" data-idx="${a-dec.range[0]}"><div class="hm-main">${y}</div><div class="hm-sub">${ys(y)} ${a}岁</div></div>`}yrScroll.value.innerHTML=h}
    if(monScroll.value) monScroll.value.innerHTML=['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'].map((n,i)=>`<div class="hm-cell ${i===selMon.value?'active':''}" data-idx="${i}"><div class="hm-main">${n}</div></div>`).join('')
    if(dayScroll.value){let h='';for(let i=0;i<new Date(yr,mon,0).getDate();i++){h+=`<div class="hm-cell ${i===selDay.value?'active':''}" data-idx="${i}"><div class="hm-main">${i+1}</div></div>`}dayScroll.value.innerHTML=h}
    if(hrScroll.value) hrScroll.value.innerHTML=hours.map((n,i)=>`<div class="hm-cell ${i===selHr.value?'active':''}" data-idx="${i}"><div class="hm-main">${n.split(' ')[0]}</div></div>`).join('')
  } catch(e) { horoStatus.value='❌ '+e.message }
}

function onDecClick(e){const c=e.target.closest('[data-idx]');if(!c)return;selDec.value=parseInt(c.dataset.idx);selYr.value=0;selMon.value=0;selDay.value=0;refreshHoroscope();if(horoscope.value)sfzzTarget.value=horoscope.value.decadal.index}
function onYrClick(e){const c=e.target.closest('[data-idx]');if(!c)return;selYr.value=parseInt(c.dataset.idx);selMon.value=0;selDay.value=0;refreshHoroscope();if(horoscope.value){const br=horoscope.value.yearly.earthlyBranch,t=astrolabe.value?.palaces.find(p=>p.earthlyBranch===br);if(t)sfzzTarget.value=t.index}}
function onMonClick(e){const c=e.target.closest('[data-idx]');if(!c)return;selMon.value=parseInt(c.dataset.idx);selDay.value=0;refreshHoroscope()}
function onDayClick(e){const c=e.target.closest('[data-idx]');if(!c)return;selDay.value=parseInt(c.dataset.idx);refreshHoroscope()}
function onHrClick(e){const c=e.target.closest('[data-idx]');if(!c)return;selHr.value=parseInt(c.dataset.idx);refreshHoroscope()}

function getSvg(){let s=document.getElementById('sfzz-svg');if(!s&&gridRef.value){s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.id='sfzz-svg';s.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10';gridRef.value.appendChild(s)}return s}
function drawSfzz(pi){const g=gridRef.value;if(!g){setTimeout(()=>drawSfzz(pi),100);return}const svg=getSvg();if(!svg)return;const rect=g.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);const pts=[pi,(pi+6)%12,(pi+4)%12,(pi+8)%12].map(i=>{const l={0:[3,0],1:[2,0],2:[1,0],3:[0,0],4:[0,1],5:[0,2],6:[0,3],7:[1,3],8:[2,3],9:[3,3],10:[3,2],11:[3,1]};const [r,c]=l[i]||[0,0];const w=rect.width/4,h=rect.height/4;if(r===0&&c===0)return{x:(c+1)*w,y:(r+1)*h};if(r===0&&c===3)return{x:c*w,y:(r+1)*h};if(r===3&&c===3)return{x:c*w,y:r*h};if(r===3&&c===0)return{x:(c+1)*w,y:r*h};if(r===0)return{x:(c+0.5)*w,y:(r+1)*h};if(c===3)return{x:c*w,y:(r+0.5)*h};if(r===3)return{x:(c+0.5)*w,y:r*h};if(c===0)return{x:(c+1)*w,y:(r+0.5)*h};return{x:(c+0.5)*w,y:(r+0.5)*h}});svg.innerHTML='';[[0,2],[2,3],[0,3],[0,1]].forEach(([f,t]) =>{const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',pts[f].x);l.setAttribute('y1',pts[f].y);l.setAttribute('x2',pts[t].x);l.setAttribute('y2',pts[t].y);l.setAttribute('stroke','#e67e22');l.setAttribute('stroke-width','2');l.setAttribute('stroke-dasharray','5,3');l.setAttribute('stroke-opacity','0.7');svg.appendChild(l)})}
function clearSfzz(){const s=document.getElementById('sfzz-svg');if(s)s.innerHTML=''}
function onPalaceClick(pi){if(sfzzTarget.value===pi){sfzzTarget.value=-1;clearSfzz()}else{sfzzTarget.value=pi;drawSfzz(pi)}}
watch(sfzzTarget,(v)=>{if(v>=0)setTimeout(()=>drawSfzz(v),100);else clearSfzz()})
let resizeTimer; window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(sfzzTarget.value>=0)drawSfzz(sfzzTarget.value)},300)})

onMounted(() => { if (props.record) onBuild() })
</script>

<style scoped>
.astro-view { max-width: 1300px; margin: 0 auto; }
.view-header { display: flex; align-items: center; gap: 12px; padding: 12px 0; }
.back-btn { padding: 6px 16px; background: #4a90d9; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.view-title { font-size: 18px; font-weight: 700; flex: 1; }
.view-name { font-size: 14px; color: #888; }
.panel { background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: flex-end; }
.field { display: flex; flex-direction: column; gap: 3px; }
.field label { font-size: 12px; color: #666; }
.field input, .field select { padding: 6px 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 13px; min-width: 110px; }
button { padding: 7px 20px; background: #4a90d9; color: #fff; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; }
.error { color: #e74c3c; padding: 8px 0; font-size: 13px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
td, th { padding: 4px 6px; border: 1px solid #eee; }
.tlabel { width: 70px; font-weight: 600; color: #555; }
.horo-panel { margin-bottom: 16px; }
.horo-module { margin-bottom: 5px; }
.hm-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.hm-title { font-size: 12px; font-weight: 700; color: #555; min-width: 32px; }
.hm-scroll { display: flex; gap: 3px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: thin; }
.hm-cell { flex-shrink: 0; background: #f5f5f5; border: 1px solid #e0e0e0; border-radius: 4px; padding: 3px 8px; text-align: center; cursor: pointer; min-width: 48px; font-size: 10px; }
.hm-cell.active { background: #c0392b; color: #fff; }
.hm-cell .hm-main { font-size: 11px; font-weight: 600; }
.hm-cell .hm-sub { font-size: 8px; color: #888; }
.hm-cell.active .hm-sub { color: #fcc; }
.horo-status { font-size: 11px; color: #666; margin-top: 3px; }
.astro-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid #bbb; position: relative; aspect-ratio: 1; max-width: 600px; margin: 0 auto; }
.palace-card { background: #fafafa; outline: 1px solid #bbb; padding: 2px; font-size: 9px; display: grid; grid-template-rows: 1fr auto auto auto; grid-template-columns: 1fr 1fr 1fr; gap: 1px 0; position: relative; cursor: pointer; }
.palace-card.sfzz-target { background: #fff3cd; outline: 3px solid #d35400; z-index: 3; }
.palace-card.sfzz-highlight { background: #fff8e1; outline: 2px solid #e67e22; z-index: 2; }
.palace-card.empty { background: transparent; outline: none; pointer-events: none; }
.stars-area { grid-column: 1/4; display: flex; flex-wrap: wrap; align-items: flex-start; align-content: flex-start; gap: 1px 3px; padding: 1px 0; }
.star-item { display: flex; flex-direction: column; align-items: center; line-height: 1.1; min-width: 12px; }
.star-item .sn { font-size: 9px; font-weight: 600; writing-mode: vertical-lr; }
.star-item .sb { font-size: 7px; color: #888; line-height: 1; margin-top: 1px; }
.star-item .sm { font-size: 6px; color: #fff; background: #c0392b; border-radius: 2px; padding: 0 1px; line-height: 1.2; margin-top: 1px; }
.empty-star { color: #ccc; font-size: 7px; }
.transit-area { position: absolute; right: 1px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: row-reverse; gap: 1px; z-index: 1; }
.ts-item { font-size: 7px; font-weight: 600; writing-mode: vertical-lr; }
.ts-decadal { color: #c55a11; } .ts-yearly { color: #2e75b6; } .ts-monthly { color: #548235; } .ts-daily { color: #bf8f00; } .ts-hourly { color: #843c0c; }
.decadal-area { grid-column: 1/4; text-align: center; font-size: 8px; color: #666; padding: 1px 0; border-top: 1px dotted #ddd; border-bottom: 1px dotted #ddd; }
.deities-area { grid-column: 1; align-self: end; display: flex; flex-direction: column; font-size: 7px; color: #777; line-height: 1.2; padding: 1px; }
.name-area { grid-column: 2; align-self: end; display: flex; align-items: flex-end; justify-content: center; font-weight: 700; font-size: 11px; color: #c0392b; }
.stem-area { grid-column: 3; align-self: end; display: flex; flex-direction: column; align-items: flex-end; writing-mode: vertical-lr; line-height: 1; padding: 0; margin: 0 -2px -2px 0; }
.stem-area .cs12 { font-size: 7px; color: #888; }
.stem-area .sb-text { font-size: 10px; color: #555; }
.body-mark { position: absolute; right: 2px; top: 50%; transform: translateY(-50%); font-size: 8px; color: #c0392b; background: #fff; border: 1px solid #c0392b; border-radius: 3px; font-weight: 600; writing-mode: vertical-lr; padding: 1px; z-index: 2; }
</style>
