<template>
  <div class="ev-import-export-panel">
    <!-- 导入区 -->
    <div class="ev-import-export-panel__section">
      <div class="ev-import-export-panel__section-head">
        <ev-icon name="upload" :size="16" />
        <span class="ev-import-export-panel__section-title">{{ importTitle }}</span>
      </div>
      <p v-if="importTip" class="ev-import-export-panel__tip">{{ importTip }}</p>
      <div class="ev-import-export-panel__section-body">
        <ev-upload
          :action="action"
          :accept="accept"
          :auto-upload="autoUpload"
          :limit="1"
          :disabled="importing"
          @change="handleFileChange"
          @remove="importing = false"
        >
          <ev-button :loading="importing">
            <ev-icon v-if="!importing" name="upload-filled" :size="14" />
            {{ importing ? '导入中…' : importButtonText }}
          </ev-button>
        </ev-upload>
        <ev-button
          v-if="templateName"
          type="primary"
          text
          @click="emit('download-template')"
        >
          <ev-icon name="download" :size="14" />
          下载模板
        </ev-button>
      </div>
    </div>

    <div class="ev-import-export-panel__divider" role="separator" />

    <!-- 导出区 -->
    <div class="ev-import-export-panel__section">
      <div class="ev-import-export-panel__section-head">
        <ev-icon name="download" :size="16" />
        <span class="ev-import-export-panel__section-title">{{ exportTitle }}</span>
      </div>
      <p v-if="exportTip" class="ev-import-export-panel__tip">{{ exportTip }}</p>
      <div class="ev-import-export-panel__section-body">
        <ev-button
          v-for="fmt in formats"
          :key="fmt"
          :type="fmt === defaultFormat ? 'primary' : 'default'"
          :disabled="exporting"
          @click="handleExport(fmt)"
        >
          <ev-icon name="download" :size="14" />
          导出 {{ fmt.toUpperCase() }}
        </ev-button>
      </div>
      <slot name="export-extra" />
    </div>
  </div>
</template>

<script setup>
/**
 * EvImportExportPanel — 导入导出面板（业务封装）
 * 导入：EvUpload 选择文件（默认手动上传，change 上报）；导出：格式按钮组；
 * 实际 IO 由消费方在事件里完成（组件不执行网络请求）：import-file / export / download-template
 */
import { ref } from 'vue'
import EvButton from '../button/index.vue'
import EvIcon from '../icon/index.vue'
import EvUpload from '../upload/index.vue'

const props = defineProps({
  importTitle: { type: String, default: '批量导入' },
  exportTitle: { type: String, default: '数据导出' },
  importTip: { type: String, default: '' },
  exportTip: { type: String, default: '' },
  importButtonText: { type: String, default: '选择文件' },
  /** 上传地址；空则由消费方在 import-file 里自行处理 */
  action: { type: String, default: '' },
  accept: { type: String, default: '.xlsx,.xls,.csv' },
  autoUpload: { type: Boolean, default: false },
  /** 模板名；非空显示"下载模板"按钮 */
  templateName: { type: String, default: '' },
  formats: { type: Array, default: () => ['xlsx', 'csv'] },
  defaultFormat: { type: String, default: 'xlsx' },
})

const emit = defineEmits(['import-file', 'export', 'download-template'])

const importing = ref(false)
const exporting = ref(false)

function handleFileChange(file) {
  if (!file) return
  importing.value = true
  emit('import-file', file)
}

function handleExport(format) {
  exporting.value = true
  emit('export', format)
}

/** 由消费方在 IO 完成后调用 */
function done(kind = 'import') {
  if (kind === 'import') importing.value = false
  else exporting.value = false
}
defineExpose({ done })
</script>

<style src="./style.css"></style>
