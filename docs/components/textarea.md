# Textarea 文本域

多行文本输入：字数统计、自动增高、错误与帮助文案，可接入 [Form](/components/form) 校验（validateEvent）。

## 基础用法

<DemoBlock>
  <eb-textarea v-model="intro" placeholder="请输入项目介绍" :rows="4" />
  <eb-text size="small" type="info" style="margin-top:8px;display:block">已输入 {{ intro.length }} 字</eb-text>
</DemoBlock>

## 字数统计

`maxlength` 限定上限，`show-word-limit` 显示计数：

<DemoBlock>
  <eb-textarea v-model="bio" :maxlength="50" show-word-limit placeholder="一句话介绍（50 字内）" />
</DemoBlock>

## 自动增高

`autosize` 随内容伸缩；对象形态可约束行数区间：

<DemoBlock>
  <eb-space direction="column" size="middle">
    <eb-textarea v-model="auto1" autosize placeholder="最小 2 行，随内容长高" />
    <eb-textarea v-model="auto2" :autosize="{ minRows: 2, maxRows: 5 }" placeholder="2–5 行之间伸缩" />
  </eb-space>
</DemoBlock>

## 错误与帮助文案

error 优先级高于 help，适合接校验结果：

<DemoBlock>
  <eb-space direction="column" size="middle">
    <eb-textarea v-model="h1" help="支持 Markdown 语法" placeholder="备注" />
    <eb-textarea v-model="h2" error="内容包含敏感词，请修改" placeholder="备注" />
  </eb-space>
</DemoBlock>

<script setup>
import { ref } from 'vue'
const intro = ref('')
const bio = ref('')
const auto1 = ref('')
const auto2 = ref('')
const h1 = ref('')
const h2 = ref('')
</script>

<ApiTable title="Textarea Props" :rows="[
  { name: 'modelValue', desc: '绑定值（v-model）', type: 'string | number', default: '' },
  { name: 'rows', desc: '默认行数', type: 'number', default: '3' },
  { name: 'autosize', desc: '自动增高；对象形态 { minRows, maxRows } 约束区间', type: 'boolean | object', default: 'false' },
  { name: 'maxlength', desc: '最大输入长度', type: 'number', default: '—' },
  { name: 'show-word-limit', desc: '显示字数统计（需配合 maxlength）', type: 'boolean', default: 'false' },
  { name: 'placeholder', desc: '占位文案', type: 'string', default: '' },
  { name: 'disabled / readonly', desc: '禁用 / 只读', type: 'boolean', default: 'false' },
  { name: 'error', desc: '错误文案（显示在下方）', type: 'string', default: '' },
  { name: 'help', desc: '帮助文案（error 缺省时显示）', type: 'string', default: '' },
  { name: 'size', desc: '尺寸（缺省跟随 Form）', type: 'large | default | small', default: '' },
  { name: 'validateEvent', desc: '接入 Form 时触发校验', type: 'boolean', default: 'true' },
]" />

<ApiTable title="Textarea Events" :rows="[
  { name: 'input / change', desc: '输入 / 值变更提交', type: '(value: string) => void', default: '—' },
  { name: 'focus / blur', desc: '聚焦 / 失焦', type: '(e: FocusEvent) => void', default: '—' },
]" />
