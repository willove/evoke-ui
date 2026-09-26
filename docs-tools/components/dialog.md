# EtDialog · 模态对话框

模态：焦点陷阱 + Esc 收敛 + 焦点归还，与 Backstage、命令面板同一套焦点管理。


<script setup>
import { ref } from 'vue'
const open = ref(false)
</script>

<DemoBlock>
  <eb-button type="primary" size="small" @click="open = true">打开模态</eb-button>
  <et-dialog v-model="open" title="另存为" confirm-text="保存" cancel-text="取消" @confirm="open = false">
    <p style="margin: 0;">Tab 在陷阱内循环，Esc 收敛并把焦点还给触发按钮。</p>
  </et-dialog>
</DemoBlock>

## Props

| 名称 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `modelValue` | Boolean | `false` | 开关 |
| `title` | String | `''` | 标题（`aria-label` 取它，缺省「对话框」） |
| `width` | String \| Number | `'520px'` | 面板宽；数字按 px |
| `closeOnClickMask` | Boolean | `true` | 点遮罩关闭（只认遮罩自身，面板冒泡已过滤） |
| `closeOnEsc` | Boolean | `true` | Esc 收敛；false 时 Esc 不关（焦点陷阱仍生效） |
| `confirmText` | String | `''` | 确认钮文案；给了才渲染 |
| `cancelText` | String | `''` | 取消钮文案；给了才渲染 |

## Emits

| 名称 | 载荷 | 说明 |
| --- | --- | --- |
| `update:modelValue` | boolean | 开关回写 |
| `confirm` | —— | 确认点击（随后关闭；执行体归消费方） |
| `cancel` | —— | 取消点击（随后关闭） |
| `opened` / `closed` | —— | 过渡结束 |

## Slots

| 名称 | 作用域 | 说明 |
| --- | --- | --- |
| 默认 | —— | 正文 |
| `footer` | —— | 整体接管底栏；给了就不渲染内置双钮 |

## 行为

- Teleport 到 body，遮罩与面板同走 `--et-z-modal`（面板在遮罩之后渲染，同档后者居上）。
- 焦点陷阱：打开后焦点落面板内第一个可聚焦元素，Tab 在陷阱内循环；关闭后归还触发器，触发器已卸载则落容器内第一个。
- Esc 只发 `update:modelValue`，关闭态由消费方掌握。
- `confirm` / `cancel` 点击后都关闭并 emit；`footer` 槽或空文案都不渲染对应钮。

## 令牌与门禁

- `--et-z-modal`（3000）、过渡时长走 `--eb-duration-*`。
- M3 验收：焦点陷阱与 Esc 收敛在 Dialog / Backstage / 命令面板三处一致。
- 过渡名走常量绑定（G2 提取器误判防护）。
