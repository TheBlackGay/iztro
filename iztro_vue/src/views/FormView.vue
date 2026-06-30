<template>
  <div class="form-page">
    <div class="form-header">
      <button class="back-btn" @click="$emit('back')">〈 返回</button>
      <span class="form-title">{{ record ? '编辑命盘' : '添加命盘' }}</span>
    </div>

    <div class="form-body">
      <div class="field">
        <label>姓名</label>
        <input v-model="form.name" placeholder="请输入姓名" />
      </div>
      <div class="field">
        <label>性别</label>
        <select v-model="form.gender">
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
      </div>
      <div class="field">
        <label>日期类型</label>
        <select v-model="form.birthType">
          <option value="solar">阳历</option>
          <option value="lunar">农历</option>
        </select>
      </div>
      <div class="field">
        <label>出生日期</label>
        <input v-model="form.birthDate" placeholder="YYYY-M-D" />
      </div>
      <div class="field">
        <label>出生时辰</label>
        <select v-model.number="form.birthHour">
          <option v-for="(l,i) in hours" :key="i" :value="i">{{ l }}</option>
        </select>
      </div>
      <div class="field">
        <label>分类标签</label>
        <select v-model="form.group">
          <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
        </select>
      </div>
      <div class="field">
        <label>备注</label>
        <textarea v-model="form.note" placeholder="备注信息"></textarea>
      </div>

      <button class="save-btn" @click="onSave">保存</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as db from '../services/db.js'

const props = defineProps({ record: Object })
const emit = defineEmits(['back', 'saved'])

const hours = ['早子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时','晚子时']
const groups = ['亲人','朋友','同学','同事','客户','名人','其他','发小','测试']

const form = ref({
  name: '', gender: '男', birthType: 'solar', birthDate: '', birthHour: 2,
  group: '朋友', subGroup: '', note: '', tags: [],
})

onMounted(() => {
  if (props.record) {
    form.value = { ...props.record }
  }
})

function onSave() {
  if (!form.value.name.trim()) { alert('请输入姓名'); return }
  if (!form.value.birthDate.trim()) { alert('请输入出生日期'); return }

  const data = {
    name: form.value.name.trim(),
    gender: form.value.gender,
    birthType: form.value.birthType,
    birthDate: form.value.birthDate.trim(),
    birthHour: form.value.birthHour,
    group: form.value.group,
    subGroup: form.value.subGroup || '',
    note: form.value.note || '',
    tags: [form.value.group],
    birthText: '',
  }

  if (props.record) {
    db.update(props.record.id, data)
  } else {
    db.add(data)
  }

  emit('saved')
}
</script>

<style scoped>
.form-page { max-width: 600px; margin: 0 auto; padding: 16px; }
.form-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.back-btn { padding: 6px 16px; background: #4a90d9; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
.form-title { font-size: 18px; font-weight: 700; }
.form-body { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 13px; color: #666; margin-bottom: 4px; }
.field input, .field select, .field textarea {
  width: 100%; padding: 8px 10px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px;
}
.field textarea { min-height: 60px; resize: vertical; }
.save-btn { width: 100%; padding: 10px; background: #4a90d9; color: #fff; border: none; border-radius: 6px; font-size: 15px; cursor: pointer; margin-top: 8px; }
.save-btn:hover { opacity: 0.9; }
</style>
