<template>
  <div class="api-table vp-raw">
    <h3 class="api-table__title">{{ title }}</h3>
    <table class="api-table__table">
      <thead>
        <tr>
          <th>参数</th>
          <th>说明</th>
          <th>类型</th>
          <th>默认值</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.name">
          <td class="api-table__name">{{ row.name }}</td>
          <td>{{ row.desc }}</td>
          <td class="api-table__type">{{ row.type }}</td>
          <td class="api-table__default">{{ row.default }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
/**
 * ApiTable — API 参数表格
 * rows = [{ name, desc, type, default }]
 */
defineProps({
  title: { type: String, default: 'API' },
  rows: { type: Array, default: () => [] },
})
</script>
