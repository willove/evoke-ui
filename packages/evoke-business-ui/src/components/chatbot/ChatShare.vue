<template>
  <EbDialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="480px"
    :append-to-body="appendToBody"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="eb-chat-share">
      <template v-if="hasLink">
        <p class="eb-chat-share__lead">{{ labels.share.linkLead }}</p>
        <div class="eb-chat-share__link">
          <input
            ref="linkInputRef"
            class="eb-chat-share__input"
            type="text"
            readonly
            :value="link"
            :aria-label="labels.share.linkLabel"
            @focus="selectLink"
          >
          <button type="button" class="eb-chat-share__copy" @click="copyLink">
            <eb-icon :name="copied ? 'check' : 'copy-document'" :size="13" />
            <span>{{ copied ? labels.share.copied : labels.share.copy }}</span>
          </button>
        </div>

        <dl class="eb-chat-share__meta">
          <div class="eb-chat-share__row">
            <dt>{{ labels.share.scopeLabel }}</dt>
            <dd>{{ currentScope?.label || '—' }}</dd>
          </div>
          <div class="eb-chat-share__row">
            <dt>{{ labels.share.expiryLabel }}</dt>
            <dd>{{ currentExpiry?.label || labels.share.never }}</dd>
          </div>
        </dl>

        <p class="eb-chat-share__note">{{ labels.share.revokeHint }}</p>
      </template>

      <template v-else>
        <p class="eb-chat-share__lead">{{ labels.share.intro }}</p>

        <fieldset class="eb-chat-share__group">
          <legend>{{ labels.share.scopeLabel }}</legend>
          <label
            v-for="option in resolvedScopes"
            :key="option.key"
            class="eb-chat-share__option"
            :class="{ 'is-active': option.key === scope }"
          >
            <input
              type="radio"
              name="eb-chat-share-scope"
              :value="option.key"
              :checked="option.key === scope"
              @change="emit('update:scope', option.key)"
            >
            <span class="eb-chat-share__option-body">
              <span class="eb-chat-share__option-label">{{ option.label }}</span>
              <span v-if="option.desc" class="eb-chat-share__option-desc">{{ option.desc }}</span>
            </span>
          </label>
        </fieldset>

        <fieldset class="eb-chat-share__group">
          <legend>{{ labels.share.expiryLabel }}</legend>
          <div class="eb-chat-share__chips">
            <button
              v-for="option in resolvedExpiries"
              :key="option.key"
              type="button"
              class="eb-chat-share__chip"
              :class="{ 'is-active': option.key === expiry }"
              :aria-pressed="option.key === expiry"
              @click="emit('update:expiry', option.key)"
            >
              {{ option.label }}
            </button>
          </div>
        </fieldset>
      </template>
    </div>

    <template #footer>
      <div class="eb-chat-share__footer">
        <template v-if="hasLink">
          <button type="button" class="eb-chat-share__btn" @click="emit('update:modelValue', false)">
            {{ labels.share.close }}
          </button>
          <button type="button" class="eb-chat-share__btn is-danger" @click="emit('revoke')">
            {{ labels.share.revoke }}
          </button>
        </template>
        <template v-else>
          <button type="button" class="eb-chat-share__btn" @click="emit('update:modelValue', false)">
            {{ labels.share.cancel }}
          </button>
          <button type="button" class="eb-chat-share__btn is-primary" :disabled="creating" @click="emit('create')">
            {{ creating ? labels.share.creating : labels.share.create }}
          </button>
        </template>
      </div>
    </template>
  </EbDialog>
</template>

<script setup>
import EbDialog from "../dialog/index.vue"
import EbIcon from "../icon/index.vue"
import { ref, computed } from "vue";
import { copyToClipboard } from "./utils";
import { chatLabels as labels } from "./labels";
const props = defineProps({
  /** 弹层开关（v-model） */
  modelValue: { type: Boolean, required: false, default: false },
  /** 会话标题，仅用于弹层标题 */
  title: { type: String, required: false, default: "" },
  /** 分享链接；空串表示还没创建，组件进入配置态 */
  link: { type: String, required: false, default: "" },
  /** 宿主正在创建链接（按钮转 loading 文案） */
  creating: { type: Boolean, required: false, default: false },
  /** 可选范围 [{ key, label, desc? }] */
  scopes: { type: Array, required: false, default: () => [] },
  /** 当前范围（v-model:scope） */
  scope: { type: String, required: false, default: "anyone" },
  /** 有效期选项 [{ key, label }] */
  expiries: { type: Array, required: false, default: () => [] },
  /** 当前有效期（v-model:expiry） */
  expiry: { type: String, required: false, default: "7d" },
  /** 挂到 body 以脱离宿主 overflow / z-index 上下文；关掉则内联渲染 */
  appendToBody: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["update:modelValue", "update:scope", "update:expiry", "create", "revoke", "copy"]);

const linkInputRef = ref(null);
const copied = ref(false);
const hasLink = computed(() => !!props.link);
const dialogTitle = computed(() =>
  props.title ? `${labels.share.title}「${props.title}」` : labels.share.title
);

const DEFAULT_SCOPES = [
  { key: "anyone", label: labels.share.scopeAnyone, desc: labels.share.scopeAnyoneDesc },
  { key: "org", label: labels.share.scopeOrg, desc: labels.share.scopeOrgDesc },
  { key: "invited", label: labels.share.scopeInvited, desc: labels.share.scopeInvitedDesc }
];
const DEFAULT_EXPIRIES = [
  { key: "7d", label: labels.share.expiry7 },
  { key: "30d", label: labels.share.expiry30 },
  { key: "never", label: labels.share.expiryNever }
];
const resolvedScopes = computed(() => (props.scopes.length ? props.scopes : DEFAULT_SCOPES));
const resolvedExpiries = computed(() => (props.expiries.length ? props.expiries : DEFAULT_EXPIRIES));
const currentScope = computed(() => resolvedScopes.value.find((s) => s.key === props.scope) || null);
const currentExpiry = computed(() => resolvedExpiries.value.find((e) => e.key === props.expiry) || null);

/** 聚焦即全选，省掉用户三击选中的动作 */
function selectLink() {
  linkInputRef.value?.select?.();
}
async function copyLink() {
  try {
    await copyToClipboard(props.link);
    copied.value = true;
    emit("copy", props.link);
    setTimeout(() => {
      copied.value = false;
    }, 2e3);
  } catch {
    // 剪贴板被拒时不提示成功
  }
}

</script>

<style scoped>

.eb-chat-share {
  display: flex;
  flex-direction: column;
  gap: var(--eb-space-4);
}

.eb-chat-share__lead {
  margin: 0;
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-secondary);
  line-height: 1.7;
}

.eb-chat-share__link {
  display: flex;
  gap: var(--eb-space-2);
}

.eb-chat-share__input {
  flex: 1;
  min-width: 0;
  padding: var(--eb-space-2) var(--eb-space-3);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-lighter);
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-sm);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.eb-chat-share__input:focus-visible {
  outline: none;
  border-color: var(--eb-color-primary);
}

.eb-chat-share__copy {
  display: inline-flex;
  align-items: center;
  gap: var(--eb-space-1);
  flex-shrink: 0;
  padding: 0 var(--eb-space-4);
  border: 1px solid var(--eb-color-primary);
  border-radius: var(--eb-radius-md);
  background: var(--eb-color-primary);
  color: #fff;
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  cursor: pointer;
}

.eb-chat-share__copy:hover {
  background: var(--eb-color-primary-dark-2);
}

.eb-chat-share__copy:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-share__meta {
  margin: 0;
  padding: var(--eb-space-3);
  border-radius: var(--eb-radius-md);
  background: var(--eb-fill-color-lighter);
}

.eb-chat-share__row {
  display: flex;
  justify-content: space-between;
  gap: var(--eb-space-3);
  font-size: var(--eb-font-size-sm);
}

.eb-chat-share__row + .eb-chat-share__row {
  margin-top: var(--eb-space-1);
}

.eb-chat-share__row dt {
  color: var(--eb-text-color-placeholder);
}

.eb-chat-share__row dd {
  margin: 0;
  color: var(--eb-text-color-primary);
}

.eb-chat-share__note {
  margin: 0;
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  line-height: 1.6;
}

.eb-chat-share__group {
  margin: 0;
  padding: 0;
  border: none;
}

.eb-chat-share__group legend {
  padding: 0;
  margin-bottom: var(--eb-space-2);
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
}

.eb-chat-share__option {
  display: flex;
  align-items: flex-start;
  gap: var(--eb-space-2);
  padding: var(--eb-space-2) var(--eb-space-3);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-md);
  cursor: pointer;
  transition: border-color var(--eb-duration-fast) var(--eb-ease-out), background-color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-share__option + .eb-chat-share__option {
  margin-top: var(--eb-space-2);
}

.eb-chat-share__option:hover {
  border-color: var(--eb-color-primary-light-5);
}

.eb-chat-share__option.is-active {
  border-color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}

.eb-chat-share__option input {
  margin-top: 3px;
  accent-color: var(--eb-color-primary);
}

.eb-chat-share__option-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.eb-chat-share__option-label {
  font-size: var(--eb-font-size-sm);
  color: var(--eb-text-color-primary);
}

.eb-chat-share__option-desc {
  font-size: var(--eb-font-size-xs);
  color: var(--eb-text-color-placeholder);
  line-height: 1.5;
}

.eb-chat-share__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--eb-space-2);
}

.eb-chat-share__chip {
  padding: 2px var(--eb-space-3);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-xs);
  font-family: inherit;
  cursor: pointer;
  transition: border-color var(--eb-duration-fast) var(--eb-ease-out), color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-share__chip:hover {
  border-color: var(--eb-color-primary-light-5);
  color: var(--eb-color-primary);
}

.eb-chat-share__chip.is-active {
  border-color: var(--eb-color-primary);
  color: var(--eb-color-primary);
  background: var(--eb-color-primary-light-9);
}

.eb-chat-share__chip:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-share__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--eb-space-2);
}

.eb-chat-share__btn {
  padding: var(--eb-space-1) var(--eb-space-4);
  border: 1px solid var(--eb-border-color-light);
  border-radius: var(--eb-radius-md);
  background: transparent;
  color: var(--eb-text-color-regular);
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  cursor: pointer;
}

.eb-chat-share__btn:hover {
  border-color: var(--eb-color-primary-light-5);
  color: var(--eb-color-primary);
}

.eb-chat-share__btn.is-primary {
  border-color: var(--eb-color-primary);
  background: var(--eb-color-primary);
  color: #fff;
}

.eb-chat-share__btn.is-primary:hover:not(:disabled) {
  background: var(--eb-color-primary-dark-2);
  color: #fff;
}

.eb-chat-share__btn.is-danger {
  border-color: var(--eb-color-danger);
  color: var(--eb-color-danger);
}

.eb-chat-share__btn.is-danger:hover {
  background: var(--eb-color-danger-light-9);
  color: var(--eb-color-danger);
}

.eb-chat-share__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.eb-chat-share__btn:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}
</style>
