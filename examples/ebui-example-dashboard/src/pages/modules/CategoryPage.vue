<template>
  <div class="cg-page">
    <eb-page-header title="分类管理" subtitle="维护商品类目层级与商品归属">
      <template #actions>
        <eb-button type="primary" size="small" @click="openCreate(null)">
          <eb-icon name="plus" :size="14" />
          新增一级分类
        </eb-button>
      </template>
    </eb-page-header>

    <eb-row :gutter="16" class="cg-block">
      <!-- 左：分类树导航 -->
      <eb-col :xs="24" :sm="9" :lg="7">
        <eb-section-card title="分类树" :padding="false" class="cg-tree-card">
          <div class="cg-tree-search">
            <eb-input v-model="keyword" placeholder="搜索分类名称">
              <template #prefix>
                <eb-icon name="search" :size="14" />
              </template>
            </eb-input>
          </div>
          <div class="cg-tree-body">
            <eb-tree
              ref="treeRef"
              :data="categories"
              node-key="id"
              :props="{ label: 'name' }"
              default-expand-all
              highlight-current
              :current-node-key="selectedId"
              :expand-on-click-node="false"
              :indent="14"
              :filter-node-method="filterNode"
              @node-click="onNodeClick"
            >
              <template #default="{ data }">
                <span class="cg-tree-node" :class="{ 'is-muted': data.status === 'disabled' }">
                  <span class="cg-tree-node__name">{{ data.name }}</span>
                  <span class="cg-tree-node__count">{{ data.goodsCount }}</span>
                </span>
              </template>
            </eb-tree>
          </div>
          <div class="cg-tree-foot">共 {{ allCount }} 个分类 · {{ disabledCount }} 个已停用</div>
        </eb-section-card>
      </eb-col>

      <!-- 右：当前分类详情 -->
      <eb-col :xs="24" :sm="15" :lg="17">
        <eb-section-card :padding="false" class="cg-detail-card">
          <template #header>
            <div class="cg-detail-title">
              <span class="cg-detail-title__path">
                <template v-for="(seg, i) in pathSegments" :key="seg.id">
                  <span class="cg-detail-title__sep" v-if="i > 0">/</span>
                  <span :class="{ 'is-current': i === pathSegments.length - 1 }">{{ seg.name }}</span>
                </template>
              </span>
              <eb-status-tag :value="selected.status" :statuses="CATEGORY_STATUS" />
            </div>
          </template>
          <template #extra>
            <eb-button size="small" @click="openCreate(selected)">
              <eb-icon name="bottom-add" :size="14" />
              子分类
            </eb-button>
            <eb-button size="small" @click="openEdit(selected)">编辑</eb-button>
            <eb-popconfirm
              v-if="selected.status === 'enabled'"
              title="停用后前台不再展示该分类，确认停用？"
              @confirm="toggleStatus(selected)"
            >
              <eb-button size="small" type="danger" plain>停用</eb-button>
            </eb-popconfirm>
            <eb-button v-else size="small" type="success" plain @click="toggleStatus(selected)">启用</eb-button>
          </template>

          <div class="cg-detail-body">
            <eb-detail-descriptions :column="3" :border="false" :data="selectedInfo" :items="infoItems" />

            <div class="cg-goods-head">
              <span class="cg-goods-head__title">分类商品</span>
              <eb-tag size="small" effect="plain">共 {{ selectedGoods.length }} 件</eb-tag>
              <span v-if="childIdsOf(selected).size" class="cg-goods-head__hint">含全部子分类商品</span>
            </div>
            <eb-data-table
              v-if="selectedGoods.length"
              :columns="goodsColumns"
              :data="selectedGoods"
              :show-pagination="false"
              :show-total="false"
            >
              <template #name="{ row }">
                <eb-cell-stack :main="row.name" :sub="row.spec" />
              </template>
              <template #stock="{ row }">
                <span :class="{ 'cg-stock--low': row.stock < SAFE_STOCK }">{{ row.stock }}</span>
              </template>
              <template #listed="{ row }">
                <eb-switch v-model="row.listed" size="small" @change="onToggleListed(row)" />
              </template>
            </eb-data-table>
            <div v-else class="cg-goods-empty">
              <eb-empty-state
                icon="goods"
                size="compact"
                title="暂无商品"
                description="该分类（含子分类）下还没有挂载商品，可到「商品列表」新增。"
              />
            </div>
          </div>
        </eb-section-card>
      </eb-col>
    </eb-row>

    <!-- 新增 / 编辑弹窗 -->
    <eb-dialog
      v-model="dialogVisible"
      :title="editing ? `编辑「${editing.name}」` : parent ? `在「${parent.name}」下新增子分类` : '新增一级分类'"
      width="460px"
      :close-on-click-modal="false"
    >
      <eb-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <eb-form-item label="分类名称" prop="name">
          <eb-input v-model="form.name" placeholder="请输入分类名称" maxlength="12" show-word-limit />
        </eb-form-item>
        <eb-form-item label="排序" prop="sort">
          <eb-input-number v-model="form.sort" :min="1" :max="99" style="width: 160px" />
          <span class="cg-suffix">数字越小越靠前</span>
        </eb-form-item>
      </eb-form>
      <template #footer>
        <eb-button @click="dialogVisible = false">取消</eb-button>
        <eb-button type="primary" @click="save">保存</eb-button>
      </template>
    </eb-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'
import { categories, goods, CATEGORY_STATUS } from '../mock.js'

const SAFE_STOCK = 10

/* ---------------- 左树：搜索 + 选中 ---------------- */
const keyword = ref('')
const treeRef = ref(null)
const selectedId = ref(1)

watch(keyword, (value) => treeRef.value?.filter(value))

function filterNode(value, data) {
  return !value || data.name.includes(value)
}

function onNodeClick(data) {
  selectedId.value = data.id
}

/* ---------------- 选中分类的派生信息 ---------------- */
function findPath(list, id, trail = []) {
  for (const node of list) {
    const next = [...trail, node]
    if (node.id === id) return next
    if (node.children) {
      const hit = findPath(node.children, id, next)
      if (hit) return hit
    }
  }
  return null
}

const selected = computed(() => {
  const path = findPath(categories, selectedId.value)
  return path ? path[path.length - 1] : categories[0]
})

const pathSegments = computed(() => findPath(categories, selected.value.id) ?? [])

function collectIds(node) {
  const ids = [node.id]
  for (const child of node.children || []) ids.push(...collectIds(child))
  return ids
}

const selectedGoods = computed(() => {
  const ids = new Set(collectIds(selected.value))
  return goods.filter((g) => ids.has(g.categoryId))
})

function childIdsOf(node) {
  return new Set((node.children || []).map((c) => c.id))
}

const selectedInfo = computed(() => ({
  goodsCount: selectedGoods.value.length,
  childCount: (selected.value.children || []).length,
  sort: selected.value.sort,
  path: pathSegments.value.map((s) => s.name).join(' / '),
}))

const infoItems = [
  { prop: 'goodsCount', label: '商品总数' },
  { prop: 'childCount', label: '直接子分类' },
  { prop: 'sort', label: '排序' },
]

const allCount = computed(() => collectIds({ id: 0, children: categories }).length - 1)
const disabledCount = computed(() => {
  let n = 0
  const walk = (list) => list.forEach((x) => (x.status === 'disabled' && n++, walk(x.children || [])))
  walk(categories)
  return n
})

/* ---------------- 右侧商品表 ---------------- */
const goodsColumns = [
  { prop: 'name', label: '商品', slot: 'name', minWidth: 200 },
  { prop: 'price', label: '售价（元）', align: 'right', width: 110 },
  { prop: 'stock', label: '库存', slot: 'stock', align: 'right', width: 90 },
  { prop: 'listed', label: '上架', slot: 'listed', width: 90 },
]

function onToggleListed(row) {
  EbMessage[row.listed ? 'success' : 'info'](`「${row.name}」已${row.listed ? '上架' : '下架'}`)
}

/* ---------------- 新增 / 编辑 / 状态 ---------------- */
const dialogVisible = ref(false)
const editing = ref(null)
const parent = ref(null)
const formRef = ref(null)
const form = reactive({ name: '', sort: 1 })
const rules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
}

let nextId = 100

function openCreate(parentRow) {
  editing.value = null
  parent.value = parentRow ?? null
  Object.assign(form, { name: '', sort: 1 })
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

function openEdit(row) {
  editing.value = row
  parent.value = null
  Object.assign(form, { name: row.name, sort: row.sort })
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

function save() {
  formRef.value
    .validate()
    .then(() => {
      if (editing.value) {
        editing.value.name = form.name
        editing.value.sort = form.sort
        EbMessage.success('分类已更新')
      } else {
        const node = {
          id: ++nextId,
          name: form.name,
          goodsCount: 0,
          sort: form.sort,
          status: 'enabled',
        }
        if (parent.value) {
          parent.value.children = parent.value.children || []
          parent.value.children.push(node)
          EbMessage.success(`已在「${parent.value.name}」下新增子分类`)
        } else {
          categories.push(node)
          EbMessage.success('一级分类已新增')
        }
        selectedId.value = node.id
      }
      dialogVisible.value = false
    })
    .catch(() => {
      EbMessage.warning('请先完善表单必填项')
    })
}

function toggleStatus(row) {
  row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
  EbMessage.success(`分类「${row.name}」已${row.status === 'enabled' ? '启用' : '停用'}`)
}
</script>

<style scoped>
.cg-page {
  padding: 16px;
}
.cg-block {
  margin-top: 16px;
}

/* ── 左树 ── */
.cg-tree-card {
  min-height: 520px;
}
.cg-tree-search {
  padding: 12px 12px 4px;
}
.cg-tree-body {
  padding: 8px 12px 12px;
}
.cg-tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding-right: 4px;
}
.cg-tree-node__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cg-tree-node.is-muted .cg-tree-node__name {
  color: var(--eb-text-color-secondary, #8a9099);
  text-decoration: line-through;
  text-decoration-color: var(--eb-border-color, #c8ccd2);
}
.cg-tree-node__count {
  flex-shrink: 0;
  min-width: 28px;
  padding: 0 6px;
  font-size: var(--eb-font-size-xs, 12px);
  line-height: 18px;
  text-align: center;
  color: var(--eb-text-color-secondary, #8a9099);
  background: var(--eb-fill-color, #f2f3f5);
  border-radius: var(--eb-radius-full, 999px);
}
.cg-tree-foot {
  padding: 10px 16px;
  font-size: var(--eb-font-size-xs, 12px);
  color: var(--eb-text-color-secondary, #8a9099);
  border-top: 1px solid var(--eb-border-color-extra-light, #f0f1f3);
}

/* ── 右详情 ── */
.cg-detail-card {
  min-height: 520px;
}
.cg-detail-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cg-detail-title__path {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--eb-font-size-base, 14px);
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-secondary, #8a9099);
}
.cg-detail-title__path .is-current {
  color: var(--eb-text-color-primary, #1f2329);
}
.cg-detail-body {
  padding: 16px;
}
.cg-goods-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 0 10px;
  margin-top: 6px;
  border-top: 1px solid var(--eb-border-color-extra-light, #f0f1f3);
}
.cg-goods-head__title {
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
}
.cg-goods-head__hint {
  font-size: var(--eb-font-size-xs, 12px);
  color: var(--eb-text-color-secondary, #8a9099);
}
.cg-stock--low {
  color: var(--eb-color-danger, #e34d59);
  font-weight: 600;
}
.cg-goods-empty {
  padding: 20px 0 28px;
}
.cg-suffix {
  margin-left: 10px;
  font-size: 12px;
  color: var(--eb-text-color-secondary, #8a9099);
}
</style>
