<template>
  <div class="dc-page">
    <eb-page-header title="知识文档" subtitle="产品手册、接入指南与最佳实践">
      <template #actions>
        <eb-button type="primary" size="small" @click="EbMessage.info('示例：进入文档编辑器')">
          <eb-icon name="plus" :size="14" />
          新建文档
        </eb-button>
      </template>
    </eb-page-header>

    <eb-row :gutter="16" class="dc-block">
      <!-- 左：目录树 -->
      <eb-col :xs="24" :sm="8" :lg="6">
        <eb-section-card title="知识目录" :padding="false" class="dc-tree-card">
          <div class="dc-tree-search">
            <eb-input v-model="keyword" placeholder="搜索目录 / 文档">
              <template #prefix>
                <eb-icon name="search" :size="14" />
              </template>
            </eb-input>
          </div>
          <div class="dc-tree-body">
            <eb-tree
              ref="treeRef"
              :data="docTree"
              node-key="id"
              :props="{ label: 'name' }"
              default-expand-all
              highlight-current
              :expand-on-click-node="false"
              :indent="12"
              :filter-node-method="filterNode"
              @node-click="onNodeClick"
            />
          </div>
        </eb-section-card>
      </eb-col>

      <!-- 右：文章列表 -->
      <eb-col :xs="24" :sm="16" :lg="18">
        <eb-section-card :padding="false" class="dc-list-card">
          <template #header>
            <div class="dc-list-title">
              <span>{{ categoryName }}</span>
              <eb-tag size="small" effect="plain">共 {{ filteredArticles.length }} 篇</eb-tag>
            </div>
          </template>
          <template #extra>
            <eb-input v-model="articleKeyword" placeholder="搜索文档标题" style="width: 200px">
              <template #prefix>
                <eb-icon name="search" :size="14" />
              </template>
            </eb-input>
          </template>

          <eb-data-table
            :columns="columns"
            :data="filteredArticles"
            :show-pagination="false"
            :show-total="false"
            stripe
            border
          >
            <template #title="{ row }">
              <div class="dc-doc">
                <div class="dc-doc__main">
                  <eb-icon name="file-text" :size="15" class="dc-doc__icon" />
                  <span class="dc-doc__name" @click="EbMessage.info(`示例：阅读「${row.title}」`)">{{ row.title }}</span>
                  <eb-tag v-for="t in row.tags" :key="t" size="small" effect="plain" class="dc-doc__tag">{{ t }}</eb-tag>
                </div>
                <div class="dc-doc__meta">{{ row.id }} · 更新于 {{ row.updatedAt }}</div>
              </div>
            </template>
            <template #category="{ row }">
              <eb-tag effect="plain">{{ row.category }}</eb-tag>
            </template>
            <template #author="{ row }">
              <div class="dc-author">
                <eb-avatar :size="22">{{ row.author.slice(0, 1) }}</eb-avatar>
                <span>{{ row.author }}</span>
              </div>
            </template>
            <template #views="{ row }">
              <span class="dc-views">{{ row.views.toLocaleString() }}</span>
            </template>
            <template #status="{ row }">
              <eb-status-tag :value="row.status" :statuses="ARTICLE_STATUS" />
            </template>
            <template #operations="{ row }">
              <eb-button text type="primary" size="small" @click="EbMessage.info(`示例：阅读「${row.title}」`)">阅读</eb-button>
              <eb-button text size="small" @click="EbMessage.info(`示例：编辑「${row.title}」`)">编辑</eb-button>
            </template>
          </eb-data-table>
        </eb-section-card>
      </eb-col>
    </eb-row>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { EbMessage } from '@wil-works/evoke-business-ui'
import { docTree, articles, ARTICLE_STATUS } from '../mock.js'

/* ---------------- 左树 ---------------- */
const keyword = ref('')
const treeRef = ref(null)
const categoryId = ref(null)

watch(keyword, (value) => treeRef.value?.filter(value))

function filterNode(value, data) {
  return !value || data.name.includes(value)
}

function onNodeClick(data) {
  categoryId.value = categoryId.value === data.id ? null : data.id
}

const categoryName = computed(() => {
  if (!categoryId.value) return '全部文档'
  const found = findName(docTree, categoryId.value)
  return found ? `分类：${found}` : '全部文档'
})

function findName(list, id) {
  for (const node of list) {
    if (node.id === id) return node.name
    if (node.children) {
      const hit = findName(node.children, id)
      if (hit) return hit
    }
  }
  return null
}

/* ---------------- 右列表 ---------------- */
const articleKeyword = ref('')

const filteredArticles = computed(() =>
  articles.filter((a) => {
    const catNames = categoryNames(categoryId.value)
    const hitCat = !categoryId.value || catNames.has(a.category)
    const hitKeyword = !articleKeyword.value || a.title.includes(articleKeyword.value)
    return hitCat && hitKeyword
  }),
)

function categoryNames(id) {
  const names = new Set()
  const walk = (list) => {
    for (const node of list) {
      if (node.id === id) {
        names.add(node.name)
        ;(node.children || []).forEach((c) => walk([c]))
      } else if (node.children) {
        walk(node.children)
      }
    }
  }
  walk(docTree)
  // 命中父级时聚合所有子分类的同名文章
  return names
}

const columns = [
  { prop: 'title', label: '文档标题', slot: 'title', minWidth: 320 },
  { prop: 'category', label: '分类', slot: 'category', width: 110 },
  { prop: 'author', label: '作者', slot: 'author', width: 120 },
  { prop: 'views', label: '浏览量', slot: 'views', align: 'right', width: 90 },
  { prop: 'status', label: '状态', slot: 'status', width: 96 },
  // 操作列由 data-table 依 #operations 插槽自动追加，勿在 columns 重复声明
]
</script>

<style scoped>
.dc-page {
  padding: 16px;
}
.dc-block {
  margin-top: 16px;
}
.dc-tree-card,
.dc-list-card {
  min-height: 520px;
}
.dc-tree-search {
  padding: 12px 12px 6px;
}
.dc-tree-body {
  padding: 6px 12px 12px;
}
.dc-list-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: var(--eb-font-weight-semibold, 600);
  color: var(--eb-text-color-primary, #1f2329);
}
.dc-views {
  font-variant-numeric: tabular-nums;
}
.dc-doc__main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.dc-doc__icon {
  color: var(--eb-text-color-secondary, #8a9099);
  flex-shrink: 0;
}
.dc-doc__name {
  font-weight: var(--eb-font-weight-medium, 500);
  color: var(--eb-text-color-primary, #1f2329);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dc-doc__name:hover {
  color: var(--eb-color-primary, #175dff);
}
.dc-doc__tag {
  flex-shrink: 0;
}
.dc-doc__meta {
  margin-top: 3px;
  padding-left: 23px;
  font-size: var(--eb-font-size-xs, 12px);
  color: var(--eb-text-color-secondary, #8a9099);
}
.dc-author {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>
