<template>
  <div class="archive-page">
    <!-- 模块1：顶部导航栏 -->
    <div class="top-bar">
      <div class="tb-left" @click="goBack">〈 关闭</div>
      <div class="tb-title">文墨天机专业版</div>
      <div class="tb-right" @click="goAstrolabe">命盘 〉</div>
    </div>

    <!-- 模块2：云备份按钮 -->
    <div class="cloud-bar">
      <button class="cloud-btn">☁️ 备份到iCloud</button>
      <button class="cloud-btn">☁️ 从iCloud恢复</button>
      <button class="cloud-btn">👤 我的</button>
    </div>

    <!-- 模块3：搜索框 -->
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input v-model="searchText" class="search-input" placeholder="搜索姓名、备注、标签…" @input="onSearch" />
      <span v-if="searchText" class="clear-icon" @click="clearSearch">✕</span>
    </div>

    <!-- 模块4：双层分类标签 -->
    <div class="tag-section">
      <div class="tag-row-1">
        <span
          v-for="g in groups"
          :key="g"
          class="tag"
          :class="{ active: activeGroup === g }"
          @click="selectGroup(g)"
        >{{ g }}</span>
      </div>
      <div class="tag-row-2">
        <span
          v-for="sg in subGroups"
          :key="sg"
          class="tag sub"
          :class="{ active: activeSubGroup === sg }"
          @click="selectSubGroup(sg)"
        >{{ sg }}</span>
      </div>
    </div>

    <!-- 模块5：表头 -->
    <div class="list-header">
      <span class="col name">姓名</span>
      <span class="col gender">性别</span>
      <span class="col birth">生辰</span>
      <span class="col note">备注</span>
    </div>

    <!-- 模块6：列表 -->
    <div class="list-body">
      <div
        v-for="item in filteredList"
        :key="item.id"
        class="list-row"
        :class="{ even: filteredList.indexOf(item) % 2 === 1, selected: selectedId === item.id }"
        @click="selectItem(item.id)"
        @dblclick="goAstrolabe(item)"
      >
        <span class="col name">{{ item.name }}</span>
        <span class="col gender">{{ item.gender }}</span>
        <span class="col birth">{{ formatBirth(item) }}</span>
        <span class="col note">{{ item.note || '无' }}</span>
      </div>
      <div v-if="filteredList.length === 0" class="empty-tip">暂无命盘数据</div>
    </div>

    <!-- 模块7：底部按钮 -->
    <div class="bottom-bar">
      <button class="action-btn" @click="onAdd">添加</button>
      <button class="action-btn" @click="onEdit">修改</button>
      <button class="action-btn" @click="onDelete">删除</button>
      <button class="action-btn primary" @click="onChart">排盘</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import * as dbService from '../services/db.js'

const emit = defineEmits(['navigate'])

const searchText = ref('')
const activeGroup = ref('')
const activeSubGroup = ref('')
const selectedId = ref(null)
const dataList = ref([])

const groups = ['全部', '亲人', '朋友', '同学', '同事', '客户', '名人', '其他', '发小']

const subGroupMap = {
  '全部': ['全部'],
  '名人': ['全部', '历史', '明星', '案例'],
  '测试': ['全部', '案例'],
  '朋友': ['全部'],
  '亲人': ['全部'],
  '同学': ['全部'],
  '同事': ['全部'],
  '客户': ['全部'],
  '其他': ['全部'],
  '发小': ['全部'],
}

const subGroups = computed(() => subGroupMap[activeGroup.value] || ['全部'])

const filteredList = computed(() => {
  let list = dataList.value

  // 搜索过滤
  if (searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    list = list.filter(r =>
      (r.name && r.name.toLowerCase().includes(kw)) ||
      (r.note && r.note.toLowerCase().includes(kw)) ||
      (r.tags && r.tags.some(t => t.toLowerCase().includes(kw))) ||
      (r.birthText && r.birthText.toLowerCase().includes(kw))
    )
  }

  // 标签过滤
  if (activeGroup.value && activeGroup.value !== '全部') {
    list = list.filter(r => r.group === activeGroup.value)
  }
  if (activeSubGroup.value && activeSubGroup.value !== '全部') {
    list = list.filter(r => r.subGroup === activeSubGroup.value)
  }

  return list
})

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {}, 300)
}
function clearSearch() { searchText.value = '' }

function selectGroup(g) {
  activeGroup.value = activeGroup.value === g ? '' : g
  activeSubGroup.value = ''
}
function selectSubGroup(sg) {
  activeSubGroup.value = activeSubGroup.value === sg ? '' : sg
}
function selectItem(id) { selectedId.value = selectedId.value === id ? null : id }

function formatBirth(item) {
  if (item.birthText) return item.birthText
  const prefix = item.birthType === 'lunar' ? '农历' : ''
  const timeNames = ['早子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时','晚子时']
  const hour = timeNames[item.birthHour] || item.birthHour + '时'
  return `${prefix}${item.birthDate} ${hour}`
}

function getSelected() {
  return dataList.value.find(r => r.id === selectedId.value) || null
}

function goBack() { /* 返回上一页 */ }
function goAstrolabe(record) {
  const r = record || getSelected()
  if (r) emit('navigate', 'astrolabe', r)
}

function onAdd() {
  emit('navigate', 'form', null)
}

function onEdit() {
  const r = getSelected()
  if (!r) { alert('请先选择一条命盘'); return }
  emit('navigate', 'form', r)
}

function onDelete() {
  const r = getSelected()
  if (!r) { alert('请先选择一条命盘'); return }
  if (!confirm(`确定删除「${r.name}」的命盘？删除后无法恢复。`)) return
  dbService.remove(r.id)
  if (selectedId.value === r.id) selectedId.value = null
  loadData()
}

function onChart() {
  const r = getSelected()
  if (!r) { alert('请先选择一条命盘'); return }
  emit('navigate', 'astrolabe', r)
}

function loadData() {
  dataList.value = dbService.getAll()
}

onMounted(() => {
  dbService.seedDemoData()
  loadData()
})
</script>

<style scoped>
.archive-page {
  max-width: 600px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  color: #333;
}

/* 顶部导航 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.tb-left, .tb-right { font-size: 14px; color: #4a90d9; cursor: pointer; }
.tb-title { font-size: 16px; font-weight: 700; color: #222; }

/* 云备份 */
.cloud-bar {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.cloud-btn {
  flex: 1;
  padding: 8px 0;
  border: 1px solid #b3d4f7;
  border-radius: 6px;
  background: #eaf4ff;
  color: #4a90d9;
  font-size: 12px;
  cursor: pointer;
  text-align: center;
}

/* 搜索 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.search-icon { font-size: 14px; }
.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  background: #f0f0f0;
  padding: 8px 12px;
  border-radius: 6px;
}
.clear-icon { font-size: 16px; color: #999; cursor: pointer; padding: 4px; }

/* 标签 */
.tag-section {
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #eee;
}
.tag-row-1, .tag-row-2 {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: none;
}
.tag-row-1::-webkit-scrollbar, .tag-row-2::-webkit-scrollbar { display: none; }
.tag-row-2 { margin-top: 4px; }
.tag {
  flex-shrink: 0;
  padding: 4px 14px;
  border-radius: 14px;
  background: #f0f0f0;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
}
.tag.active { background: #e8d5ff; color: #7c3aed; font-weight: 600; }
.tag.sub { font-size: 11px; padding: 3px 12px; }
.tag.sub.active { background: #dbeafe; color: #2563eb; }

/* 表头 */
.list-header {
  display: flex;
  padding: 10px 16px;
  background: #4a90d9;
  color: #fff;
  font-weight: 700;
  font-size: 13px;
  position: sticky;
  top: 0;
  z-index: 5;
}
.col { flex: 1; text-align: center; }
.col.name { flex: 1.5; text-align: left; }
.col.gender { flex: 0.6; }
.col.birth { flex: 2; }
.col.note { flex: 1; text-align: right; }

/* 列表 */
.list-body {
  flex: 1;
  overflow-y: auto;
}
.list-row {
  display: flex;
  padding: 10px 16px;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
}
.list-row.even { background: #fafafa; }
.list-row.selected { background: #e8f0fe; }
.list-row:hover { background: #f0f5ff; }

.empty-tip {
  padding: 40px;
  text-align: center;
  color: #999;
}

/* 底部 */
.bottom-bar {
  display: flex;
  padding: 10px 16px;
  gap: 8px;
  background: #fff;
  border-top: 1px solid #eee;
}
.action-btn {
  flex: 1;
  padding: 10px 0;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #fff;
  color: #555;
  font-size: 14px;
  cursor: pointer;
  text-align: center;
}
.action-btn.primary { background: #4a90d9; color: #fff; border-color: #4a90d9; }
.action-btn:hover { opacity: 0.85; }
</style>
