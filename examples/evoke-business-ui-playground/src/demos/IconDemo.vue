<template>
  <section class="demo">
    <h2>EvIcon（内置图标 / 业务语义 / 文件类型 / PascalCase 容错）</h2>

    <div class="demo-row">
      <span class="demo-label">常用图标</span>
      <span v-for="name in epIcons" :key="name" class="icon-cell" :title="name">
        <ev-icon :name="name" :size="20" />
      </span>
    </div>

    <div class="demo-row">
      <span class="demo-label">业务语义</span>
      <span v-for="name in fontIcons" :key="name" class="icon-cell" :title="name">
        <ev-icon :name="name" :size="20" />
      </span>
    </div>

    <div class="demo-row">
      <span class="demo-label">文件类型</span>
      <span v-for="name in colorIcons" :key="name" class="icon-cell" :title="name">
        <ev-icon :name="name" :size="22" />
      </span>
    </div>

    <div class="demo-row">
      <span class="demo-label">PascalCase</span>
      <ev-icon name="CircleCheckFilled" :size="20" />
      <ev-icon name="Search" :size="20" />
      <ev-icon name="WarningFilled" :size="20" color="var(--ev-color-warning)" />
      <ev-icon name="loading" :size="20" class="is-rotating" />
    </div>
  </section>
</template>

<script setup>
const epIcons = ['search', 'plus', 'close', 'check', 'delete', 'edit', 'download', 'upload', 'setting', 'user', 'lock', 'view']
const fontIcons = ['ai', 'approval', 'audit', 'api', 'bank', 'dashboard', 'history']
const colorIcons = ['file-excel', 'xlsx', 'xls', 'file-word', 'docx', 'file-ppt', 'pptx', 'file-pdf', 'file-zip', 'file-code', 'md']
</script>

<style scoped>
.demo h2 {
  font-size: var(--ev-font-size-md);
  font-weight: var(--ev-font-weight-semibold);
  margin-bottom: var(--ev-space-4);
}
.demo-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ev-space-2);
  margin-bottom: var(--ev-space-4);
}
.demo-label {
  width: 90px;
  font-size: var(--ev-font-size-sm);
  color: var(--ev-text-color-secondary);
}
.icon-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--ev-radius-md);
  color: var(--ev-text-color-regular);
  transition: background-color var(--ev-duration-fast) var(--ev-ease-out);
}
.icon-cell:hover {
  background-color: var(--ev-fill-color-light);
}
</style>
