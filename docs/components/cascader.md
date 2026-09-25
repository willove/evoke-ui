# Cascader 级联选择

多级层级数据的单选/多选选择器：按列展开逐级选择，支持搜索、清空、多选标签与自定义字段名。

## 基础用法

<DemoBlock>
  <div style="max-width: 320px">
    <eb-cascader v-model="region" :options="options" placeholder="请选择省 / 市 / 区" />
    <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">选中值：{{ JSON.stringify(region) }}</p>
  </div>
</DemoBlock>

## 可搜索

`filterable` 开启后可输入关键字过滤候选（按节点 label 匹配）：

<DemoBlock>
  <div style="max-width: 320px">
    <eb-cascader v-model="region2" :options="options" filterable placeholder="输入「杭州」试试" />
  </div>
</DemoBlock>

## 多选

`multiple` 开启后以标签展示选中路径，可单个移除；`collapse-tags` 折叠超出标签为 +N：

<DemoBlock>
  <div style="max-width: 420px">
    <eb-cascader v-model="multi" :options="options" multiple collapse-tags placeholder="可多选" />
    <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">选中：{{ JSON.stringify(multi) }}</p>
  </div>
</DemoBlock>

## 懒加载

`lazy` + `load-data` 按需拉取子级：选项只需声明 `leaf: false`，展开该节点时才调用加载函数，期间该列展示加载态；`load-data(option)` 返回 Promise，子级在 `option.children` 就地写入（或直接由 Promise 返回）后并入面板：

<DemoBlock>
  <div style="max-width: 320px">
    <eb-cascader v-model="lazyRegion" :options="lazyOptions" lazy :load-data="onLoadData" placeholder="懒加载选择区域" />
    <p style="margin-top: 8px; font-size: 12px; color: var(--eb-text-color-secondary);">选中值：{{ JSON.stringify(lazyRegion) }}</p>
  </div>
</DemoBlock>

## 禁用与清空

<DemoBlock>
  <eb-space size="middle">
    <eb-cascader :options="options" disabled placeholder="禁用状态" style="width: 240px" />
    <eb-cascader v-model="clearableVal" :options="options" placeholder="可清空" style="width: 240px" />
  </eb-space>
</DemoBlock>

<script setup>
import { ref } from 'vue'

const region = ref([])
const region2 = ref([])
const multi = ref([])
const clearableVal = ref(['zhejiang', 'hangzhou', 'xihu'])

// ─── 懒加载 ───
const lazyRegion = ref([])
const lazyOptions = ref([
  { value: 'east', label: '华东地区', leaf: false },
  { value: 'south', label: '华南地区', leaf: false },
])
function onLoadData(option) {
  return new Promise((resolve) => {
    setTimeout(() => {
      option.children = [
        { value: `${option.value}-core`, label: `${option.label} · 核心区` },
        { value: `${option.value}-sub`, label: `${option.label} · 郊区` },
      ]
      resolve()
    }, 500)
  })
}

const options = [
  {
    value: 'zhejiang',
    label: '浙江省',
    children: [
      { value: 'hangzhou', label: '杭州市', children: [{ value: 'xihu', label: '西湖区' }, { value: 'binjiang', label: '滨江区' }] },
      { value: 'ningbo', label: '宁波市', children: [{ value: 'haishu', label: '海曙区' }] },
    ],
  },
  {
    value: 'guangdong',
    label: '广东省',
    children: [
      { value: 'shenzhen', label: '深圳市', children: [{ value: 'nanshan', label: '南山区' }, { value: 'futian', label: '福田区' }] },
    ],
  },
]
</script>

## 键盘操作

触发器聚焦后 `Enter` / `↓` 打开面板、`Esc` 关闭；面板打开时 `↑` / `↓` 在当前列选项间移动高亮，`→` 展开高亮节点进入子列、`←` 回退上一列，`Enter` 选中可选节点。键盘高亮展开不依赖 hover 模式（`expand-trigger="hover"` 下同样有效），禁用项会被自动跳过。

## Cascader API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| modelValue | Array / String / Number | — | 选中值路径（v-model） |
| options | Array | `[]` | 层级数据 `{ value, label, children }` |
| multiple | Boolean | `false` | 多选 |
| collapse-tags | Boolean | `false` | 多选时超出数量的标签折叠为 +N |
| clearable | Boolean | `true` | 可清空 |
| filterable | Boolean | `false` | 可搜索 |
| filter-method | Function | — | 自定义过滤 `(node, query) => boolean` |
| disabled | Boolean | `false` | 禁用 |
| props | Object | `{}` | 自定义字段名 `{ label, value, children }` |
| lazy | Boolean | `false` | 懒加载开关（配合 load-data） |
| load-data | Function | `null` | 懒加载函数 `(option) => Promise`，展开 leaf 为 false 且无 children 的节点时调用，子级并入后可继续逐级选择 |
| ripple | Boolean | `true` | 激活涟漪动效开关：聚焦时实体色影向内收拢消散；也可在 Form 上批量关闭或全局 `setRipple(false)` |

事件：`change(value)`、`visible-change(visible)`、`clear`。
