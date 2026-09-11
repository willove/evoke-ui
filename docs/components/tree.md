# Tree 树形控件

层级数据展示与交互：展开/收起、勾选（父子联动可选）、选中高亮，常用于组织架构、目录、权限树。

## 基础用法

<DemoBlock>
  <div style="max-width: 340px; border: 1px solid var(--eb-border-color-lighter); border-radius: 8px; padding: 8px;">
    <eb-tree :data="data" default-expand-all node-key="id" @node-click="onNodeClick" />
  </div>
  <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">点击节点：{{ clicked || '—' }}</p>
</DemoBlock>

## 勾选模式

<DemoBlock>
  <div style="max-width: 340px; border: 1px solid var(--eb-border-color-lighter); border-radius: 8px; padding: 8px;">
    <eb-tree :data="data" show-checkbox node-key="id" default-expand-all :default-checked-keys="['1-1']" />
  </div>
</DemoBlock>

<script setup>
import { ref } from 'vue'

const clicked = ref('')
const data = [
  {
    id: '1',
    label: '研发部',
    children: [
      { id: '1-1', label: '前端组' },
      { id: '1-2', label: '后端组' },
    ],
  },
  {
    id: '2',
    label: '交付部',
    children: [
      { id: '2-1', label: '实施组' },
      { id: '2-2', label: '运维组' },
    ],
  },
]
function onNodeClick(node) {
  clicked.value = node.label
}
</script>

## Tree API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| data | Array | `[]` | 树数据 `{ id, label, children }`（可经 `props` 改字段名） |
| node-key | String | — | 唯一键字段 |
| show-checkbox | Boolean | `false` | 勾选模式（父子联动） |
| check-strictly | Boolean | `false` | 父子勾选不联动 |
| default-expand-all | Boolean | `false` | 默认全部展开 |
| default-expanded-keys | Array | `[]` | 默认展开节点 |
| default-checked-keys | Array | `[]` | 默认勾选节点 |
| expand-on-click-node | Boolean | `true` | 点击节点展开 |
| lazy / load | — | — | 懒加载（见 load 用法） |

事件：`node-click(node)`、`check(node, { checkedNodes })`、`expand/collapse`；暴露 `getCheckedKeys()`、`setCheckedKeys(keys)` 等实例方法。
