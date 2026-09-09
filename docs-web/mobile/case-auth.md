# 案例：登录注册

<script setup>
import { ref } from 'vue'

const phone = ref('')
const code = ref('')
const password = ref('')
const showPwd = ref(false)
const agreed = ref(false)
const agreedWarn = ref(false)
const phoneError = ref('')
const counting = ref(0)
const submitting = ref(false)
let timer = null
function sendCode() {
  if (counting.value > 0) return
  if (!/^1\d{10}$/.test(phone.value)) {
    phoneError.value = '请输入正确的 11 位手机号'
    return
  }
  phoneError.value = ''
  counting.value = 60
  timer = setInterval(() => {
    counting.value -= 1
    if (counting.value <= 0) {
      counting.value = 0
      clearInterval(timer)
    }
  }, 1000)
}
function onSubmit() {
  if (!agreed.value) {
    agreedWarn.value = true
    return
  }
  agreedWarn.value = false
  submitting.value = true
  setTimeout(() => {
    submitting.value = false
  }, 1200)
}
</script>

登录页是转化漏斗的第一道闸口：字段每多一个，流失就多一截。移动端的登录设计
只有一条铁律——**一屏一个动作**：手机号 + 验证码 + 密码收进单列，协议勾选与
第三方登录兜底，主按钮吸底对准拇指。本案例把倒计时、密码可见性切换、协议拦截
全部做成真实交互。

## 整页演示

<DemoBlock title="手机号登录 · 转化表单" description="品牌字标 + 单列三字段（验证码倒计时 / 密码可见性切换）+ 协议勾选拦截 + 吸底提交 + 第三方登录兜底。">

<MobileStage title="登录">
  <div class="mb-page" style="gap: 14px;">
    <div style="padding: 12px 4px 0;">
      <div style="font-size: 26px; font-weight: var(--ew-display-weight); letter-spacing: var(--ew-display-letter-spacing); color: var(--ew-text-primary);">EVOKE</div>
      <div style="margin-top: 6px; font-size: 13px; line-height: 1.7; color: var(--ew-text-regular);">还没有账号？验证通过后自动注册。</div>
    </div>
    <ew-field label="手机号" :error="phoneError">
      <ew-input v-model="phone" icon="smartphone" inputmode="tel" placeholder="用于登录与找回账号" :clearable="true" @input="phoneError = ''" />
    </ew-field>
    <ew-field label="验证码">
      <ew-input v-model="code" icon="shield-check" inputmode="numeric" placeholder="6 位短信验证码">
        <template #suffix>
          <ew-button variant="ghost" size="small" :disabled="counting > 0" style="padding: 0 4px;" @click="sendCode">
            {{ counting > 0 ? counting + ' s 后重发' : '获取验证码' }}
          </ew-button>
        </template>
      </ew-input>
    </ew-field>
    <ew-field label="设置密码" hint="8 位以上，建议字母 + 数字组合">
      <ew-input v-model="password" :type="showPwd ? 'text' : 'password'" icon="lock" placeholder="用于后续登录">
        <template #suffix>
          <span style="display: inline-flex; color: var(--ew-text-secondary); cursor: pointer;" @click="showPwd = !showPwd">
            <ew-icon :name="showPwd ? 'eye-off' : 'eye'" :size="16" />
          </span>
        </template>
      </ew-input>
    </ew-field>
    <div style="display: flex; align-items: flex-start; gap: 8px; cursor: pointer;" @click="agreed = !agreed; agreedWarn = false">
      <span style="flex: none; width: 16px; height: 16px; margin-top: 1px; border-radius: var(--ew-radius-full); border: 1px solid; display: inline-flex; align-items: center; justify-content: center;"
        :style="agreed ? 'background: var(--ew-color-primary); border-color: var(--ew-color-primary); color: #fff;' : (agreedWarn ? 'border-color: var(--ew-color-danger); color: transparent;' : 'color: transparent;')"
      >
        <ew-icon name="check" :size="10" />
      </span>
      <span style="font-size: 12px; line-height: 1.6;" :style="agreedWarn ? 'color: var(--ew-color-danger);' : 'color: var(--ew-text-secondary);'">
        我已阅读并同意<span style="color: var(--ew-color-primary);">《服务协议》</span>与<span style="color: var(--ew-color-primary);">《隐私政策》</span>
      </span>
    </div>
  </div>
  <template #bottom>
    <div style="padding: 12px 16px 22px; border-top: 1px solid var(--ew-border-color-light); background: var(--ew-bg-container);">
      <ew-button type="primary" block :loading="submitting" @click="onSubmit">
        {{ submitting ? '验证中…' : '登录 / 注册' }}
      </ew-button>
      <div style="display: flex; align-items: center; gap: 12px; margin-top: 14px;">
        <span style="flex: 1; height: 1px; background: var(--ew-border-color-light);" />
        <span style="font-size: 11px; color: var(--ew-text-secondary);">其他方式登录</span>
        <span style="flex: 1; height: 1px; background: var(--ew-border-color-light);" />
      </div>
      <div style="display: flex; justify-content: center; gap: 20px; margin-top: 12px;">
        <span v-for="s in ['wechat', 'apple', 'github']" :key="s" style="width: 40px; height: 40px; border-radius: var(--ew-radius-full); border: 1px solid var(--ew-border-color-light); display: inline-flex; align-items: center; justify-content: center; color: var(--ew-text-regular); cursor: pointer;">
          <ew-icon :name="s" :size="18" />
        </span>
      </div>
    </div>
  </template>
</MobileStage>

</DemoBlock>

## 拆解：桌面 → 移动做了什么

| 桌面版式 | 本案例的移动表达 |
| --- | --- |
| 登录/注册双卡切换 | 合并为一个动作：验证通过自动注册，少一次选择 |
| 三栏表单行 | 单列字段，`EwField` label 上置 + 错误内联（不弹窗报错） |
| 图形验证码 + 刷新按钮 | 短信验证码 + 倒计时后缀按钮，60 s 内置灰防重发 |
| 密码强度条 | `hint` 一句话给到规则，可见性切换收进输入框后缀 |
| 页脚协议小字 | 勾选圆点上移到按钮上方，未勾选提交时整句标红拦截 |
| 多入口并存 | 吸底区收敛为一个主按钮 + 第三方图标兜底 |

## 搭建清单

1. 字段纪律：手机号 `inputmode="tel"`、验证码 `inputmode="numeric"`，键盘直接
   出数字；错误用 `EwField` 的 `error` 内联展示，输入即清除。
2. 验证码倒计时：后缀按钮放 `EwInput` 的 `#suffix` 插槽，倒计时期间 `disabled`
   置灰；倒计时逻辑在页面层，组件不感知业务。
3. 密码可见性：`#suffix` 放 `eye / eye-off` 切换，`type` 在 `password / text`
   间切换即可。
4. 协议拦截：勾选圈用 `check` 图标反白表达选中；未勾选提交不弹窗，
   协议文案整句转危险色一次即可。
5. 第三方登录：`wechat / apple / github` 都是核心图标集内置品牌 Logo，
   40px 正圆描边按钮对齐「轻注册」语气。
