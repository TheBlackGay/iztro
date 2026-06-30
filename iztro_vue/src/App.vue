<template>
  <ArchiveList v-if="page === 'list'" @navigate="onNavigate" />
  <AstrolabeView v-else-if="page === 'astrolabe'" :record="selectedRecord" @back="page='list'" />
  <FormView v-else-if="page === 'form'" :record="editRecord" @back="page='list'" @saved="onSaved" />
</template>

<script setup>
import { ref } from 'vue'
import ArchiveList from './views/ArchiveList.vue'
import AstrolabeView from './views/AstrolabeView.vue'
import FormView from './views/FormView.vue'

const page = ref('list')
const selectedRecord = ref(null)
const editRecord = ref(null)

function onNavigate(view, record) {
  if (view === 'astrolabe') {
    selectedRecord.value = record
    page.value = 'astrolabe'
  } else if (view === 'form') {
    editRecord.value = record
    page.value = 'form'
  }
}

function onSaved() {
  page.value = 'list'
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #f5f5f5; color: #333; }
</style>
