# Modal 弹出层

<script setup>
import { ref } from 'vue'
const basicVisible = ref(false)
const mailVisible = ref(false)
const glassVisible = ref(false)
const email = ref('')
const code = ref('')
const sent = ref(false)
</script>

`EvModal` 全屏遮罩 + 居中面板：Teleport 到 body，Esc / 点击遮罩 / 关闭按钮关闭（均可配），
打开期间锁定页面滚动，焦点自动移入并在面板内首尾循环（Tab 圈闭）、关闭后归还触发元素。
适合订阅邀请、邮箱验证、确认对话等轻量弹出场景。

## 基础用法

<DemoBlock title="标题 + 内容 + 底部动作" description="遮罩点击与 Esc 默认可关闭；footer 插槽放动作按钮。">

<EvModal v-model="basicVisible" title="开通团队空间">
  <p style="margin:0 0 12px;">团队空间支持多人协作、统一账单与集中管理成员权限。</p>
  <p style="margin:0; font-size:13px; color:var(--ev-text-secondary);">升级后随时可以降级回个人版，已产生的费用按天折算。</p>
  <template #footer>
    <EvButton variant="outline" size="small" @click="basicVisible = false">再想想</EvButton>
    <EvButton size="small" @click="basicVisible = false">开通</EvButton>
  </template>
</EvModal>
<EvButton @click="basicVisible = true">打开弹出层</EvButton>

```vue
<EvModal v-model="visible" title="开通团队空间">
  <p>内容区…</p>
  <template #footer>
    <EvButton @click="visible = false">再想想</EvButton>
    <EvButton type="primary">开通</EvButton>
  </template>
</EvModal>
```

</DemoBlock>

## 弹出层 + 表单：邮箱验证

<DemoBlock title="弹出输入邮箱并验证" description="两步式邮箱验证：填邮箱 → 收验证码 → 提交；Esc / 遮罩点击关闭均已内置。">

<EvModal v-model="mailVisible" title="验证你的邮箱" width="440px">
  <div style="display:flex; flex-direction:column; gap:12px;">
    <EvField label="邮箱" required>
      <EvInput v-model="email" type="email" placeholder="you@example.com" />
    </EvField>
    <EvField label="验证码" required hint="验证码 10 分钟内有效">
      <div style="display:flex; gap:10px; align-items:center;">
        <EvInput v-model="code" placeholder="6 位验证码" style="flex:1;" />
        <EvButton variant="outline" :disabled="!email" @click="sent = true">
          {{ sent ? '已发送 ✓' : '发送验证码' }}
        </EvButton>
      </div>
    </EvField>
    <p v-if="sent && code.length >= 6" style="margin:0; font-size:13px; color:var(--ev-color-success);">
      ✓ 验证通过，欢迎加入 Evoke UI
    </p>
  </div>
  <template #footer>
    <EvButton variant="outline" size="small" @click="mailVisible = false">取消</EvButton>
    <EvButton size="small" :disabled="!sent || code.length < 6" @click="mailVisible = false">完成验证</EvButton>
  </template>
</EvModal>
<EvButton @click="mailVisible = true; sent = false; code = ''">邮箱验证示例</EvButton>

```vue
<EvModal v-model="visible" title="验证你的邮箱" width="440px">
  <EvField label="邮箱" required>
    <EvInput v-model="email" type="email" />
  </EvField>
  <EvField label="验证码">
    <EvInput v-model="code" placeholder="6 位验证码" />
  </EvField>
  <template #footer>
    <EvButton :disabled="!sent" @click="done">完成验证</EvButton>
  </template>
</EvModal>
```

</DemoBlock>

## 磨砂玻璃面板

<DemoBlock title="glass 磨砂面板" description="玻璃态下面板变半透明雾面，底层页面透出模糊色彩；blur 可单独调强度。">

<div style="background:url(/images/glass-ridge.jpg) center/cover; border-radius:14px; padding:24px; text-align:center;">
  <EvButton @click="glassVisible = true">打开磨砂弹出层</EvButton>
</div>

<EvModal v-model="glassVisible" glass title="磨砂面板" width="420px">
  <p style="margin:0;">面板呈半透明雾面，背后的渐变被模糊成柔和色块。</p>
  <template #footer>
    <EvButton size="small" @click="glassVisible = false">关闭</EvButton>
  </template>
</EvModal>

```vue
<EvModal v-model="visible" glass title="磨砂面板">
  <p>面板呈半透明雾面…</p>
</EvModal>
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| modelValue (v-model) | 可见性 | boolean | `false` |
| title | 标题（header 插槽优先） | string | `''` |
| width | 面板宽度（数字按 px） | string \| number | `'560px'` |
| overlay-close | 点击遮罩关闭 | boolean | `true` |
| esc-close | Esc 关闭 | boolean | `true` |
| lock-scroll | 打开期间锁定页面滚动 | boolean | `true` |
| show-close | 右上角关闭按钮 | boolean | `true` |
| glass | 磨砂玻璃面板；缺省跟随全局（ConfigProvider glass） | boolean | — |
| blur | 磨砂强度（px），内联覆盖 `--ev-glass-blur` | string / number | — |
| saturate | 磨砂饱和度（倍数），内联覆盖 `--ev-glass-saturate` | string / number | — |
| tint | 磨砂底色浓度（%），内联覆盖 `--ev-glass-bg` | string / number | — |

### 事件

| 事件 | 说明 |
| --- | --- |
| update:modelValue | 可见性双向绑定 |
| open / opened | 开始打开 / 进出场结束 |
| close / closed | 开始关闭 / 离场结束 |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| default | 内容区 |
| header | 头部覆写（含标题） |
| footer | 底部动作区 |
