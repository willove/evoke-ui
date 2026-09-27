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

## API

<CompApi id="dialog" />

## 行为

- Teleport 到 body，遮罩与面板同走 `--et-z-modal`（面板在遮罩之后渲染，同档后者居上）。
- 焦点陷阱：打开后焦点落面板内第一个可聚焦元素，Tab 在陷阱内循环；关闭后归还触发器，触发器已卸载则落容器内第一个。
- Esc 只发 `update:modelValue`，关闭态由消费方掌握。
- `confirm` / `cancel` 点击后都关闭并 emit；`footer` 槽或空文案都不渲染对应钮。

## 令牌与门禁

- `--et-z-modal`（3000）、过渡时长走 `--eb-duration-*`。
- M3 验收：焦点陷阱与 Esc 收敛在 Dialog / Backstage / 命令面板三处一致。
- 过渡名走常量绑定（G2 提取器误判防护）。
