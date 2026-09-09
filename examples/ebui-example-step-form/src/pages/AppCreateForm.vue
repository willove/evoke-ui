<template>
  <div class="af-page">
    <ev-page-header title="新建应用" subtitle="开放平台 · 应用接入">
      <template #actions>
        <ev-button size="small" @click="EvMessage.info('示例：返回应用列表')">
          <ev-icon name="back" :size="14" />
          返回应用列表
        </ev-button>
      </template>
    </ev-page-header>

    <ev-section-card class="af-card">
      <ev-steps :active="stepIndex" align-center class="af-steps">
        <ev-step title="基本资料" description="应用名称与类型" />
        <ev-step title="能力与安全" description="开通能力、接口约束" />
        <ev-step title="确认创建" description="核对信息并提交" />
      </ev-steps>

      <div v-if="!submitted" class="af-body">
        <!-- 第一步：基本资料 -->
        <ev-form v-show="stepIndex === 0" ref="form0Ref" :model="base" :rules="baseRules" label-width="96px" class="af-form">
          <ev-form-item label="应用名称" prop="name">
            <ev-input v-model="base.name" placeholder="2-30 个字符，创建后可修改" maxlength="30" show-word-limit />
          </ev-form-item>
          <ev-form-item label="应用类型" prop="type">
            <ev-radio-group v-model="base.type">
              <ev-radio label="web">Web 应用</ev-radio>
              <ev-radio label="mobile">移动应用</ev-radio>
              <ev-radio label="miniapp">小程序</ev-radio>
            </ev-radio-group>
          </ev-form-item>
          <ev-form-item label="应用简介" prop="intro">
            <ev-textarea
              v-model="base.intro"
              :rows="3"
              placeholder="简要说明应用用途，将展示在应用市场（选填，100 字以内）"
              maxlength="100"
              show-word-limit
            />
          </ev-form-item>
        </ev-form>

        <!-- 第二步：能力与安全 -->
        <ev-form v-show="stepIndex === 1" ref="form1Ref" :model="capability" :rules="capabilityRules" label-width="96px" class="af-form">
          <ev-form-item label="开通能力" prop="abilities">
            <ev-checkbox-group v-model="capability.abilities">
              <ev-checkbox label="支付">交易支付</ev-checkbox>
              <ev-checkbox label="push">消息推送</ev-checkbox>
              <ev-checkbox label="stats">数据统计</ev-checkbox>
              <ev-checkbox label="kyc">实名认证</ev-checkbox>
            </ev-checkbox-group>
          </ev-form-item>
          <ev-form-item label="频率限制" prop="rateLimit">
            <ev-input-number v-model="capability.rateLimit" :min="10" :max="10000" :step="100" />
            <span class="af-suffix">次 / 分钟，超限请求返回 429</span>
          </ev-form-item>
          <ev-form-item label="签名校验">
            <ev-switch v-model="capability.signEnabled" active-text="开启" inactive-text="关闭" />
            <span class="af-suffix">开启后所有请求需携带 HMAC-SHA256 签名</span>
          </ev-form-item>
          <ev-form-item label="回调地址" prop="callbackUrl">
            <ev-input v-model="capability.callbackUrl" placeholder="https://api.example.com/callback" />
          </ev-form-item>
        </ev-form>

        <!-- 第三步：确认创建 -->
        <div v-show="stepIndex === 2" class="af-confirm">
          <ev-alert type="warning" show-icon :closable="false" title="提交后将按开通的能力开始计费；应用创建成功后可随时在详情页停用。" class="af-alert" />
          <ev-detail-descriptions title="确认应用信息" :column="2" border :data="confirmData" :items="confirmItems" />
        </div>

        <div class="af-actions">
          <ev-button v-if="stepIndex > 0" @click="stepIndex--">上一步</ev-button>
          <ev-button v-if="stepIndex < 2" type="primary" @click="next">下一步</ev-button>
          <ev-button v-else type="primary" :loading="submitting" @click="submit">提交创建</ev-button>
        </div>
      </div>

      <!-- 结果页 -->
      <ev-result
        v-else
        status="success"
        title="应用创建成功"
        sub-title="请妥善保存应用凭证，AppSecret 仅在创建时完整展示一次。"
      >
        <div class="af-credentials">
          <div class="af-credential">
            <span class="af-credential__label">AppId</span>
            <code class="af-credential__value">{{ credential.appId }}</code>
            <ev-button size="small" text type="primary" @click="copy(credential.appId)">复制</ev-button>
          </div>
          <div class="af-credential">
            <span class="af-credential__label">AppSecret</span>
            <code class="af-credential__value">{{ credential.appSecret }}</code>
            <ev-button size="small" text type="primary" @click="copy(credential.appSecret)">复制</ev-button>
          </div>
        </div>
        <template #extra>
          <ev-button type="primary" @click="resetAll">再创建一个</ev-button>
          <ev-button @click="EvMessage.info('示例：返回应用列表')">返回应用列表</ev-button>
        </template>
      </ev-result>
    </ev-section-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { EvMessage } from '@wil-works/evoke-business-ui'

/* ---------------- 步骤状态（Steps 的 active 是普通 prop，由父层驱动） ---------------- */
const stepIndex = ref(0)
const submitted = ref(false)
const submitting = ref(false)
const credential = reactive({ appId: '', appSecret: '' })

/* ---------------- 表单模型 ---------------- */
const base = reactive({ name: '', type: 'web', intro: '' })
const capability = reactive({
  abilities: ['stats'],
  rateLimit: 600,
  signEnabled: true,
  callbackUrl: '',
})

const form0Ref = ref(null)
const form1Ref = ref(null)

const baseRules = {
  name: [
    { required: true, message: '请输入应用名称', trigger: 'blur' },
    { min: 2, max: 30, message: '长度 2-30 个字符', trigger: 'blur' },
  ],
  type: [{ required: true, message: '请选择应用类型', trigger: 'change' }],
}

const capabilityRules = {
  abilities: [{ required: true, type: 'array', min: 1, message: '至少开通一项能力', trigger: 'change' }],
  rateLimit: [{ required: true, type: 'number', message: '请设置频率上限', trigger: 'change' }],
  callbackUrl: [
    { required: true, message: '请输入回调地址', trigger: 'blur' },
    { pattern: /^https?:\/\/.+/, message: '需以 http(s):// 开头', trigger: 'blur' },
  ],
}

/* ---------------- 步骤流转：下一步前先校验当前步 ---------------- */
async function next() {
  const formRef = stepIndex.value === 0 ? form0Ref.value : form1Ref.value
  try {
    await formRef.validate()
  } catch {
    EvMessage.warning('请先完善当前步骤的必填信息')
    return
  }
  stepIndex.value++
}

/* ---------------- 第三步：确认回显 ---------------- */
const TYPE_LABEL = { web: 'Web 应用', mobile: '移动应用', miniapp: '小程序' }
const ABILITY_LABEL = { pay: '交易支付', push: '消息推送', stats: '数据统计', kyc: '实名认证' }

const confirmData = computed(() => ({
  name: base.name,
  type: TYPE_LABEL[base.type],
  intro: base.intro || '—',
  abilities: capability.abilities.map((a) => ABILITY_LABEL[a]).join('、'),
  rateLimit: `${capability.rateLimit} 次 / 分钟`,
  sign: capability.signEnabled ? '已开启' : '未开启',
  callbackUrl: capability.callbackUrl,
}))

const confirmItems = [
  { prop: 'name', label: '应用名称' },
  { prop: 'type', label: '应用类型' },
  { prop: 'abilities', label: '开通能力', span: 2 },
  { prop: 'rateLimit', label: '频率限制' },
  { prop: 'sign', label: '签名校验' },
  { prop: 'callbackUrl', label: '回调地址', span: 2 },
  { prop: 'intro', label: '应用简介', span: 2 },
]

/* ---------------- 提交与结果 ---------------- */
function randomToken(prefix, length) {
  const chars = 'abcdef0123456789'
  let s = ''
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return prefix + s
}

function submit() {
  submitting.value = true
  // 模拟创建接口
  setTimeout(() => {
    credential.appId = randomToken('app_', 16)
    credential.appSecret = randomToken('sk_', 32)
    submitting.value = false
    submitted.value = true
    EvMessage.success('应用创建成功')
  }, 800)
}

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
    EvMessage.success('已复制到剪贴板')
  } catch {
    EvMessage.error('剪贴板不可用，请手动复制')
  }
}

function resetAll() {
  Object.assign(base, { name: '', type: 'web', intro: '' })
  Object.assign(capability, { abilities: ['stats'], rateLimit: 600, signEnabled: true, callbackUrl: '' })
  form0Ref.value?.clearValidate()
  form1Ref.value?.clearValidate()
  stepIndex.value = 0
  submitted.value = false
}
</script>

<style scoped>
.af-page {
  padding: 16px;
}
.af-card {
  margin-top: 12px;
}
.af-steps {
  max-width: 720px;
  margin: 8px auto 28px;
}
.af-body {
  max-width: 760px;
  margin: 0 auto;
}
.af-form {
  padding: 8px 24px 0;
}
.af-suffix {
  margin-left: 12px;
  font-size: var(--ev-font-size-sm, 12px);
  color: var(--ev-text-color-secondary, #8a9099);
}
.af-alert {
  margin-bottom: 16px;
}
.af-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}
.af-credentials {
  display: inline-flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 24px;
  margin: 8px 0 20px;
  text-align: left;
  background: var(--ev-fill-color-light, #f7f8fa);
  border-radius: 8px;
}
.af-credential {
  display: flex;
  align-items: center;
  gap: 12px;
}
.af-credential__label {
  width: 76px;
  font-weight: var(--ev-font-weight-semibold, 600);
  color: var(--ev-text-color-regular, #4e545c);
}
.af-credential__value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  word-break: break-all;
  color: var(--ev-text-color-primary, #1f2329);
}
</style>
