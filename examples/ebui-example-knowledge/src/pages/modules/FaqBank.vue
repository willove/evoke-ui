<template>
  <div class="fq-page">
    <ev-page-header title="问答库" subtitle="高频问题沉淀，检索即答案">
      <template #actions>
        <ev-button type="primary" size="small" @click="EvMessage.info('示例：进入问答编辑器')">
          <ev-icon name="plus" :size="14" />
          新增问答
        </ev-button>
      </template>
    </ev-page-header>

    <ev-section-card class="fq-block">
      <div class="fq-toolbar">
        <ev-input v-model="keyword" placeholder="搜索问题关键词，如：权限 / 导出" style="width: 320px">
          <template #prefix>
            <ev-icon name="search" :size="14" />
          </template>
        </ev-input>
        <ev-segmented
          v-model="category"
          :options="[{ label: '全部', value: 'all' }, ...categories]"
          size="small"
        />
      </div>

      <div class="fq-list">
        <div v-for="faq in filteredFaqs" :key="faq.id" class="fq-item">
          <div class="fq-item__head" @click="toggle(faq.id)">
            <span class="fq-item__q">{{ faq.question }}</span>
            <span class="fq-item__meta">
              <ev-tag v-if="faq.accepted" size="small" type="success" effect="plain">已采纳</ev-tag>
              <ev-tag size="small" effect="plain">{{ faq.category }}</ev-tag>
              <ev-icon :name="expanded.has(faq.id) ? 'up' : 'down'" :size="14" />
            </span>
          </div>
          <div v-show="expanded.has(faq.id)" class="fq-item__answer">
            <p class="fq-item__text">{{ faq.answer }}</p>
            <div class="fq-item__foot">
              <span>{{ faq.author }} 回复</span>
              <span class="fq-item__helpful">
                有帮助（{{ faq.helpful }}）
                <ev-button text type="primary" size="small" @click="markHelpful(faq)">+1</ev-button>
              </span>
            </div>
          </div>
        </div>
        <div v-if="!filteredFaqs.length" class="fq-empty">没有匹配「{{ keyword }}」的问答</div>
      </div>
    </ev-section-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'
import { faqs } from '../mock.js'

const keyword = ref('')
const category = ref('all')

const categories = [...new Set(faqs.map((f) => f.category))].map((c) => ({ label: c, value: c }))

const expanded = reactive(new Set())

const filteredFaqs = computed(() =>
  faqs.filter((f) => {
    const hitCategory = category.value === 'all' || f.category === category.value
    const hitKeyword =
      !keyword.value || f.question.includes(keyword.value) || f.answer.includes(keyword.value)
    return hitCategory && hitKeyword
  }),
)

function toggle(id) {
  if (expanded.has(id)) expanded.delete(id)
  else expanded.add(id)
}

function markHelpful(faq) {
  faq.helpful++
  EvMessage.success('感谢反馈')
}
</script>

<style scoped>
.fq-page {
  padding: 16px;
}
.fq-block {
  margin-top: 16px;
}
.fq-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}
.fq-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fq-item {
  border: 1px solid var(--ev-border-color-light, #e5e7eb);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}
.fq-item:hover {
  border-color: var(--ev-color-primary-light-5, #94b4ff);
}
.fq-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
}
.fq-item__q {
  font-weight: var(--ev-font-weight-semibold, 600);
  color: var(--ev-text-color-primary, #1f2329);
}
.fq-item__meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.fq-item__answer {
  padding: 0 16px 12px;
  border-top: 1px dashed var(--ev-border-color-extra-light, #f0f1f3);
}
.fq-item__text {
  margin: 10px 0;
  font-size: var(--ev-font-size-base, 14px);
  line-height: 1.8;
  color: var(--ev-text-color-regular, #4e545c);
}
.fq-item__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--ev-font-size-xs, 12px);
  color: var(--ev-text-color-secondary, #8a9099);
}
.fq-item__helpful {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.fq-empty {
  padding: 40px 0;
  text-align: center;
  color: var(--ev-text-color-secondary, #8a9099);
}
</style>
