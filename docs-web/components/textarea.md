# Textarea 多行输入

`EwTextarea` 承载留言正文、评论内容等多行输入。支持行数控制与字数计数（`maxlength` 传入后
右下角实时显示 `n / max`）。

## 基础用法

<DemoBlock title="字数计数" description="maxlength 同时约束原生输入上限并开启计数。">

<EwTextarea
  v-model="msg"
  :rows="4"
  :maxlength="140"
  placeholder="想聊点什么…（最多 140 字）"
  style="max-width:480px;"
/>
<p style="margin-top:8px; font-size:13px; color:var(--ew-text-secondary);">当前：{{ msg.length }} 字</p>

<script setup>
import { ref } from 'vue'
const msg = ref('')
</script>

```vue
<EwTextarea v-model="msg" :rows="4" :maxlength="140" placeholder="想聊点什么…" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| v-model | 内容 | string | `''` |
| placeholder | 占位文案 | string | — |
| rows | 行数（初始高度） | number | `4` |
| maxlength | 最大字数（传入后显示计数） | number | `0` |
| disabled | 禁用 | boolean | `false` |
| error | 错误态 | boolean | `false` |

::: tip 组合建议
标签与错误提示交给 [EwField](./field) 管理，Textarea 只负责输入本身。
:::
