<template>
  <div class="gl-page">
    <eb-page-header title="商品列表" subtitle="商品档案、价格与上架状态">
      <template #actions>
        <eb-button type="primary" size="small" @click="openCreate">
          <eb-icon name="plus" :size="14" />
          新建商品
        </eb-button>
      </template>
    </eb-page-header>

    <eb-section-card class="gl-card">
      <eb-data-table
        title="全部商品"
        show-index
        :operations-width="150"
        :columns="columns"
        :data="goods"
        :show-pagination="false"
      >
        <template #name="{ row }">
          <eb-cell-stack :main="row.name" :sub="row.spec" />
        </template>
        <template #category="{ row }">
          <eb-tag effect="plain">{{ row.category }}</eb-tag>
        </template>
        <template #stock="{ row }">
          <span :class="{ 'gl-stock--low': row.stock < SAFE_STOCK }">{{ row.stock }}</span>
          <span v-if="row.stock < SAFE_STOCK" class="gl-stock__tip">低于安全线</span>
        </template>
        <template #listed="{ row }">
          <eb-switch v-model="row.listed" size="small" @change="onToggle(row)" />
        </template>
        <template #operations="{ row }">
          <eb-button text type="primary" size="small" @click="EbMessage.info('示例：进入商品编辑页')">编辑</eb-button>
          <eb-popconfirm title="删除后不可恢复，确认删除？" icon-type="danger" @confirm="remove(row)">
            <eb-button text type="danger" size="small">删除</eb-button>
          </eb-popconfirm>
        </template>
      </eb-data-table>
    </eb-section-card>

    <eb-dialog v-model="createVisible" title="新建商品" width="520px" :close-on-click-modal="false">
      <eb-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <eb-form-item label="商品名称" prop="name">
          <eb-input v-model="form.name" placeholder="请输入商品名称" maxlength="30" />
        </eb-form-item>
        <eb-form-item label="所属分类" prop="category">
          <eb-select v-model="form.category" style="width: 100%">
            <eb-option v-for="c in GOODS_CATEGORY" :key="c" :label="c" :value="c" />
          </eb-select>
        </eb-form-item>
        <eb-form-item label="售价" prop="price">
          <eb-input-number v-model="form.price" :min="1" :step="10" style="width: 200px" />
          <span class="gl-suffix">元</span>
        </eb-form-item>
        <eb-form-item label="库存" prop="stock">
          <eb-input-number v-model="form.stock" :min="0" :step="5" style="width: 200px" />
          <span class="gl-suffix">件（安全线 {{ SAFE_STOCK }} 件）</span>
        </eb-form-item>
      </eb-form>
      <template #footer>
        <eb-button @click="createVisible = false">取消</eb-button>
        <eb-button type="primary" @click="create">保存</eb-button>
      </template>
    </eb-dialog>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'
import { goods, GOODS_CATEGORY } from '../mock.js'

const SAFE_STOCK = 10

const columns = [
  { prop: 'name', label: '商品', slot: 'name', width: 230 },
  { prop: 'category', label: '分类', slot: 'category', width: 110 },
  { prop: 'price', label: '售价（元）', align: 'right', width: 100 },
  { prop: 'stock', label: '库存', slot: 'stock', width: 120 },
  { prop: 'listed', label: '上架', slot: 'listed', width: 80 },
]

function onToggle(row) {
  EbMessage[row.listed ? 'success' : 'info'](`「${row.name}」已${row.listed ? '上架' : '下架'}`)
}

function remove(row) {
  const i = goods.findIndex((g) => g.id === row.id)
  if (i > -1) goods.splice(i, 1)
  EbMessage.success(`已删除「${row.name}」`)
}

/* ---------------- 新建商品 ---------------- */
const createVisible = ref(false)
const formRef = ref(null)
const emptyForm = () => ({ name: '', category: GOODS_CATEGORY[0], price: 99, stock: 50 })
const form = reactive(emptyForm())

const rules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
}

function openCreate() {
  Object.assign(form, emptyForm())
  formRef.value?.clearValidate()
  createVisible.value = true
}

function create() {
  formRef.value.validate().then(() => {
    goods.unshift({
      id: `G-${Math.floor(Math.random() * 900 + 100)}`,
      name: form.name,
      spec: '-',
      category: form.category,
      price: form.price,
      stock: form.stock,
      listed: true,
    })
    EbMessage.success('商品已创建并上架')
    createVisible.value = false
  }).catch(() => {
    EbMessage.warning('请先完善表单必填项')
  })
}
</script>

<style scoped>
.gl-page {
  padding: 16px;
}
.gl-card {
  margin-top: 12px;
}
.gl-stock--low {
  color: var(--eb-color-danger, #e34d59);
  font-weight: 600;
}
.gl-stock__tip {
  margin-left: 6px;
  font-size: var(--eb-font-size-xs, 12px);
  color: var(--eb-color-danger, #e34d59);
}
.gl-suffix {
  margin-left: 10px;
  font-size: 12px;
  color: var(--eb-text-color-secondary, #8a9099);
}
</style>
