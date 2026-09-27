# EtDocumentTabs · 多文档标签条

多文档标签：脏标记双通道、关闭确认、溢出列表，契约与 EtTabStrip 同源。


<script setup>
import { ref } from 'vue'
const activeDoc = ref('a')
const docList = [
  { id: 'a', title: '一季度', dirty: true },
  { id: 'b', title: '二季度' },
  { id: 'notes', title: '备注', closable: false },
]
</script>

<DemoBlock>
  <et-document-tabs v-model="activeDoc" :documents="docList" />
  <span style="font-size: 12px; color: var(--eb-text-color-secondary);">激活：{{ activeDoc }}（脏标记 aria 双通道；「备注」不可关）</span>
</DemoBlock>

## API

<CompApi id="document-tabs" />

## 行为

- 脏标记双通道：CSS 圆点（不吃行高）+ `role="img"` `aria-label="未保存"`；读屏名补「未保存」。
- 关闭默认不弹确认（关闭是产品语义，组件不预判）；`confirmClose` + `confirmText` 双条件才用 `EbPopconfirm` 包一层。
- 溢出：复用 tab-strip 的 `planOverflow` 纯函数；全部条目常驻 DOM（溢出的只收起、不卸载）。
- 键盘：左右 / Home / End 漫游；关闭钮 `tabindex="-1"`，Delete 关闭由条级 keydown 处理。
- 点条目内的关闭钮 / 脏圆点不触发选中。
- 度量令牌与 `EtTabStrip` 逐项共用（同槽位视觉一致）。

## 令牌与门禁

- `--et-icon-xs`（关闭钮 14 档）。
- G4：关闭钮与脏标记都有可访问名。
- 内存：ResizeObserver 卸载时 disconnect。
