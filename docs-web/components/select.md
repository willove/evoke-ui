# Select 下拉选择

`EvSelect` 用自定义菜单替代原生 select 的生硬外观：选中态打勾、禁用项置灰、spring 展开、
点击外部自动收起。`bare` 嵌入形态用于 [EvSearchBox](./search-box) 等复合控件内部。

## 基础用法

<DemoBlock title="标准形态" description="点击展开菜单；选中项标主色并对勾标记。">

<div style="display:flex; gap:16px; max-width:480px;">
  <EvSelect
    v-model="city"
    :options="[
      { label: '北京', value: 'bj' },
      { label: '上海', value: 'sh' },
      { label: '深圳', value: 'sz' },
      { label: '杭州（暂不可选）', value: 'hz', disabled: true },
    ]"
    placeholder="选择城市"
  />
</div>
<p style="margin-top:8px; font-size:13px; color:var(--ev-text-secondary);">当前：{{ city || '（未选择）' }}</p>

<script setup>
import { ref } from 'vue'
const city = ref('sh')
</script>

```vue
<EvSelect
  v-model="city"
  :options="[
    { label: '北京', value: 'bj' },
    { label: '上海', value: 'sh' },
  ]"
  placeholder="选择城市"
/>
```

</DemoBlock>

## 带图标与尺寸

<DemoBlock title="选项图标 / small / large">

<div style="display:flex; gap:16px; align-items:center; max-width:520px;">
  <EvSelect
    v-model="scene"
    size="small"
    :options="[{ label: '企业官网', value: 'a', icon: 'compass-3-line' }, { label: '个人站', value: 'b', icon: 'device-line' }]"
    placeholder="场景"
  />
  <EvSelect
    v-model="scene2"
    size="large"
    :options="[{ label: '企业官网', value: 'a' }, { label: '个人站', value: 'b' }]"
    placeholder="场景"
  />
</div>

```vue
<EvSelect v-model="scene" size="small" :options="withIcons" />
```

</DemoBlock>

::: tip 在搜索栏中嵌入
`bare` 形态去边框与最小宽度，专为复合控件准备 —— [EvSearchBox](./search-box) 的分类下拉就是它。
:::

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | 当前值 | string / number | `''` |
| default-value | 非受控模式的初始值（未绑定 v-model 时生效） | string / number | — |
| options | 选项 `[{ label, value, icon?, disabled? }]` | array | `[]` |
| placeholder | 占位文案 | string | `'请选择'` |
| bare | 嵌入形态（去边框） | boolean | `false` |
| placement | 菜单方向 | `'bottom' \| 'top'` | `'bottom'` |
| disabled / error | 状态 | boolean | `false` |
| size | 尺寸 | `'small' \| 'default' \| 'large'` | `'default'` |
| glass | 下拉面板磨砂；缺省跟随全局（ConfigProvider glass） | boolean | — |
| blur | 磨砂强度（px），内联覆盖 `--ev-glass-blur` | string / number | — |

### 事件

| 事件 | 说明 | 参数 |
| --- | --- | --- |
| update:modelValue | 选择后派发 | value |
| change | 选择后派发 | value |
| visible-change | 菜单展开/收起 | boolean |
