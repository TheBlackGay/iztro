const STORAGE_KEY = 'iztro_archive_list'

let db = null

function load() {
  if (db) return db
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    db = raw ? JSON.parse(raw) : []
  } catch {
    db = []
  }
  return db
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

let nextId = 1

function ensureIds() {
  db.forEach(r => { if (!r.id) r.id = nextId++ })
  if (db.length > 0) nextId = Math.max(...db.map(r => r.id)) + 1
}

// ===== 公开 API =====

export function getAll() {
  load()
  ensureIds()
  return [...db]
}

export function getById(id) {
  load()
  return db.find(r => r.id === id) || null
}

export function add(record) {
  load()
  ensureIds()
  record.id = nextId++
  record.createdAt = Date.now()
  record.updatedAt = Date.now()
  db.push(record)
  save()
  return record.id
}

export function update(id, fields) {
  load()
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) return false
  db[idx] = { ...db[idx], ...fields, updatedAt: Date.now() }
  save()
  return true
}

export function remove(id) {
  load()
  const idx = db.findIndex(r => r.id === id)
  if (idx === -1) return false
  db.splice(idx, 1)
  save()
  return true
}

export function search(keyword) {
  load()
  if (!keyword.trim()) return [...db]
  const kw = keyword.trim().toLowerCase()
  return db.filter(r =>
    (r.name && r.name.toLowerCase().includes(kw)) ||
    (r.note && r.note.toLowerCase().includes(kw)) ||
    (r.tags && r.tags.some(t => t.toLowerCase().includes(kw))) ||
    (r.birthText && r.birthText.toLowerCase().includes(kw))
  )
}

export function filterByTags(group, subGroup) {
  load()
  let result = [...db]
  if (group && group !== '全部') result = result.filter(r => r.group === group)
  if (subGroup && subGroup !== '全部') result = result.filter(r => r.subGroup === subGroup)
  return result
}

// 初始示例数据
export function seedDemoData() {
  load()
  if (db.length > 0) return
  const demos = [
    { name: '诸葛亮', gender: '男', birthType: 'lunar', birthDate: '181-7-23', birthHour: 4, group: '名人', subGroup: '历史', note: '三国时期蜀汉丞相', tags: ['名人','历史'] },
    { name: '武则天', gender: '女', birthType: 'lunar', birthDate: '624-2-17', birthHour: 6, group: '名人', subGroup: '历史', note: '中国唯一女皇帝', tags: ['名人','历史'] },
    { name: '测试1', gender: '男', birthType: 'solar', birthDate: '2000-8-16', birthHour: 2, group: '测试', subGroup: '案例', note: '无', tags: ['测试','案例'] },
    { name: '测试2', gender: '女', birthType: 'solar', birthDate: '1995-3-20', birthHour: 0, group: '测试', subGroup: '案例', note: '无', tags: ['测试','案例'] },
    { name: '张三', gender: '男', birthType: 'solar', birthDate: '1988-12-1', birthHour: 8, group: '朋友', subGroup: '', note: '大学同学', tags: ['朋友'] },
  ]
  demos.forEach(d => add(d))
}
