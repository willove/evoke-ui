# 表单与转化

<script setup>
import { ref } from 'vue'

const name = ref('')
const contact = ref('')
const message = ref('')
const submitting = ref(false)
const sheetOpen = ref(false)
const subject = ref('')
const subjects = ['咨询合作', '加入我们', '其他']
function onSubmit() {
  if (!name.value || !message.value) return
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
    name.value = contact.value = message.value = ''
  }, 1000)
}
function pick(v) {
  subject.value = v
  sheetOpen.value = false
}
</script>

官网的转化路径（留言、订阅、报名）在移动端是一条**单列短表单**：字段砍到最少、
label 上置、主按钮吸底。桌面上「多栏并排」的表单在 375px 上会让输入区不足 200px，
一律改纵向堆叠。

## 表单页范式

三种典型控件：文本输入（`EvField` + `EvInput`，label 上置）、多行文本、底部选择面板
（枚举字段用 `EvActionSheet` 点选，能选不输）。主按钮吸底，与拇指收势位置对齐。

<DemoBlock title="单列留言表单" description="label 上置 + 整行控件 + 枚举字段底部面板点选 + 吸底提交。">

<MobileStage title="联系我们">
  <div class="mb-page">
    <ev-field label="称呼">
      <ev-input v-model="name" placeholder="怎么称呼你" />
    </ev-field>
    <ev-field label="联系方式">
      <ev-input v-model="contact" placeholder="邮箱或手机号" inputmode="email" />
    </ev-field>
    <ev-field label="来意">
      <div
        style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border: 1px solid var(--ev-border-color); border-radius: var(--ev-radius-md); background: var(--ev-bg-container); font-size: 14px; color: var(--ev-text-primary); cursor: pointer;"
        @click="sheetOpen = true"
      >
        <span :style="subject ? '' : 'color: var(--ev-text-placeholder);'">{{ subject || '请选择' }}</span>
        <span style="color: var(--ev-text-secondary);">›</span>
      </div>
    </ev-field>
    <ev-field label="留言">
      <ev-textarea v-model="message" :rows="3" placeholder="想聊点什么…" />
    </ev-field>
  </div>
  <template #bottom>
    <div style="padding: 10px 16px 24px; border-top: 1px solid var(--ev-border-color-light); background: var(--ev-bg-container);">
      <ev-button type="primary" style="width: 100%;" :loading="submitting" @click="onSubmit">
        {{ submitting ? '提交中…' : '提交留言' }}
      </ev-button>
    </div>
  </template>
  <ev-action-sheet v-model="sheetOpen" title="选择来意" :actions="subjects.map((s) => ({ name: s }))" :append-to-body="false" :lock-scroll="false" @select="(a) => pick(a.name)" />
</MobileStage>

```vue
<script setup>
import { ref } from 'vue'

const name = ref('')
const subject = ref('')
const sheetOpen = ref(false)
</script>

<template>
  <div class="mb-page">
    <EvField label="称呼"><EvInput v-model="name" placeholder="怎么称呼你" /></EvField>
    <EvField label="来意">
      <div class="picker" @click="sheetOpen = true">{{ subject || '请选择' }}</div>
    </EvField>
    <EvField label="留言"><EvTextarea v-model="message" :rows="3" /></EvField>
  </div>

  <!-- 吸底提交：真机补 env(safe-area-inset-bottom) -->
  <div class="submit-bar">
    <EvButton type="primary" style="width: 100%;" @click="onSubmit">提交留言</EvButton>
  </div>

  <EvActionSheet v-model="sheetOpen" title="选择来意" :actions="subjects" @select="pick" />
</template>
```

</DemoBlock>

规则：

- **键盘跟字段走**：邮箱字段 `inputmode="email"`、电话 `inputmode="tel"`，减少切换成本。
- **校验内联**：错误提示放在字段下方（`EvField` 的 `error`），不用弹窗报错。
- **转化即按钮**：一屏一个主 CTA；EvContactForm 桌面版的双栏行在移动端建议改单列后使用。

## 轻反馈

提交结果用**轻提示**反馈（成功 / 失败 / 网络），不阻塞页面；需要用户决策的确认
（如「放弃填写？」）用底部动作面板或居中小对话框，不要用原生 `alert`。

<DemoBlock title="提交反馈" description="提交后以轻提示确认，按钮 loading 期间防重复提交。">

<div style="display: flex; flex-direction: column; gap: 12px; max-width: 375px; margin: 0 auto;">
  <ev-button type="primary" style="width: 100%;" @click="submitting = true; setTimeout(() => submitting = false, 1200)">
    {{ submitting ? '提交中…' : '模拟一次提交' }}
  </ev-button>
</div>

</DemoBlock>
