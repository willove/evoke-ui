<template>
  <section class="demo">
    <h2>EvTable / EvTree / EvTreeSelect</h2>

    <h3>EvTable</h3>
    <div class="demo-row" style="margin-bottom: 12px">
      <ev-button size="small" @click="toggleSort">切换排序</ev-button>
      <ev-button size="small" @click="clearSelection">清空选择</ev-button>
      <span class="hint">已选 {{ selectedRows.length }} 行</span>
    </div>
    <ev-table ref="tableRef" :data="rows" border stripe @selection-change="onSelectionChange">
      <ev-table-column type="selection" width="46" />
      <ev-table-column prop="name" label="名称" min-width="140">
        <template #default="{ row }">
          <span style="font-weight: 600">{{ row.name }}</span>
        </template>
      </ev-table-column>
      <ev-table-column prop="type" label="类型" width="100" align="center">
        <template #default="{ row }">
          <ev-tag size="small" :type="row.type === '水果' ? 'success' : 'warning'">{{ row.type }}</ev-tag>
        </template>
      </ev-table-column>
      <ev-table-column prop="price" label="价格" width="120" sortable align="right" />
      <ev-table-column prop="stock" label="库存" width="120" align="right" />
      <ev-table-column label="操作" width="140" align="center">
        <template #default="{ row }">
          <ev-button size="small" text type="primary" @click="log(row)">编辑</ev-button>
          <ev-button size="small" text type="danger" @click="log(row)">删除</ev-button>
        </template>
      </ev-table-column>
    </ev-table>

    <h3>EvTree</h3>
    <div class="demo-row">
      <div style="width: 300px; border: 1px solid var(--ev-border-color-lighter); border-radius: 4px; padding: 8px">
        <ev-input v-model="treeQuery" placeholder="输入过滤" size="small" style="margin-bottom: 8px" />
        <ev-tree
          ref="treeRef"
          :data="treeData"
          node-key="id"
          show-checkbox
          default-expand-all
          :filter-node-method="filterTree"
          @check-change="onTreeCheck"
        />
      </div>
      <div style="width: 300px; border: 1px solid var(--ev-border-color-lighter); border-radius: 4px; padding: 8px">
        <p class="hint">手风琴 + lazy</p>
        <ev-tree :data="lazyRoot" node-key="id" accordion lazy :load="loadNode" />
      </div>
    </div>

    <h3>EvTreeSelect</h3>
    <div class="demo-row">
      <ev-tree-select
        v-model="treeSingle"
        :data="treeData"
        node-key="id"
        placeholder="单选（点击叶子）"
        style="width: 260px"
      />
      <ev-tree-select
        v-model="treeMulti"
        :data="treeData"
        node-key="id"
        multiple
        show-checkbox
        check-strictly
        placeholder="多选 + 复选 + 严格"
        style="width: 320px"
      />
      <ev-tree-select
        v-model="treeSingle"
        :data="treeData"
        node-key="id"
        filterable
        placeholder="可过滤"
        style="width: 220px"
      />
    </div>
    <p class="hint">单选：{{ treeSingle }} / 多选：{{ treeMulti }}</p>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'

const tableRef = ref(null)
const treeRef = ref(null)

const rows = ref(
  Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: ['苹果', '香蕉', 'CPU', '显示器', '机械键盘', '草莓', '内存条', '葡萄', '鼠标', '西瓜'][i % 10] + ` #${i + 1}`,
    type: i % 3 === 0 ? '硬件' : '水果',
    price: Math.round(Math.random() * 900) + 10,
    stock: Math.round(Math.random() * 500),
  }))
)

const selectedRows = ref([])
function onSelectionChange(sel) {
  selectedRows.value = sel
}
function clearSelection() {
  tableRef.value?.clearSelection?.()
}
function toggleSort() {
  tableRef.value?.sort?.('price', 'descending')
}
function log(row) {
  console.log('row', row)
}

const treeQuery = ref('')
watch(treeQuery, (v) => treeRef.value?.filter?.(v))

const treeData = [
  {
    id: 1, label: '研发中心',
    children: [
      { id: 11, label: '前端组', children: [{ id: 111, label: 'Web 组' }, { id: 112, label: '客户端组' }] },
      { id: 12, label: '后端组', children: [{ id: 121, label: '平台组' }] },
    ],
  },
  {
    id: 2, label: '运营中心',
    children: [{ id: 21, label: '内容组' }, { id: 22, label: '增长组' }],
  },
]

function filterTree(value, data) {
  return !value || String(data.label).includes(value)
}

function onTreeCheck(data, checked) {
  console.log('check-change', data.label, checked)
}

const lazyRoot = ref([{ id: 'l1', label: '懒加载根 1', isLeaf: false }, { id: 'l2', label: '懒加载根 2', isLeaf: true }])
function loadNode(node, resolve) {
  setTimeout(() => {
    if (node.level === 0) {
      resolve(lazyRoot.value)
      return
    }
    resolve([
      { id: `${node.data.id}-a`, label: `${node.label}-A`, isLeaf: node.level >= 2 },
      { id: `${node.data.id}-b`, label: `${node.label}-B`, isLeaf: node.level >= 2 },
    ])
  }, 400)
}

const treeSingle = ref(111)
const treeMulti = ref([11, 21])
</script>
