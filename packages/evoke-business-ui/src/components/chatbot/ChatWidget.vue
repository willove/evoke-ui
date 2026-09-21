<template>
  <!-- 移动端交给 Drawer（自带焦点圈闭 / 滚动锁 / 点击遮罩关闭），桌面端是右下角浮层 -->
  <EbDrawer
    v-if="useDrawer"
    :model-value="modelValue"
    direction="btt"
    :size="drawerSize"
    :title="title"
    :show-close="true"
    :lock-scroll="true"
    :append-to-body="appendToBody"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="eb-chat-widget__drawer-body">
      <slot v-if="!needConsent" />
      <div v-else class="eb-chat-widget__consent">
        <p class="eb-chat-widget__consent-text">{{ disclaimer }}</p>
        <slot name="disclaimer-actions" :accept="accept">
          <button type="button" class="eb-chat-widget__consent-btn" @click="accept">
            {{ labels.widget.agree }}
          </button>
        </slot>
      </div>
    </div>
  </EbDrawer>

  <Teleport v-else :to="'body'" :disabled="!appendToBody">
    <div class="eb-chat-widget" :class="[`is-${placement}`]" v-bind="$attrs">
      <Transition :name="`eb-chat-widget-panel--${placement}`">
        <section
          v-if="modelValue"
          ref="panelRef"
          class="eb-chat-widget__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          :style="panelStyle"
        >
          <header class="eb-chat-widget__header">
            <div class="eb-chat-widget__heading">
              <slot name="title">{{ title }}</slot>
            </div>
            <button
              type="button"
              class="eb-chat-widget__close"
              :title="labels.widget.close"
              :aria-label="labels.widget.close"
              @click="close"
            >
              <eb-icon name="close" :size="16" />
            </button>
          </header>
          <div class="eb-chat-widget__body">
            <slot v-if="!needConsent" />
            <div v-else class="eb-chat-widget__consent">
              <p class="eb-chat-widget__consent-text">{{ disclaimer }}</p>
              <slot name="disclaimer-actions" :accept="accept">
                <button type="button" class="eb-chat-widget__consent-btn" @click="accept">
                  {{ labels.widget.agree }}
                </button>
              </slot>
            </div>
          </div>
        </section>
      </Transition>

      <slot name="launcher" :open="modelValue" :toggle="toggle">
        <EbFloatButton
          :icon="icon"
          :badge-value="badge"
          :tooltip="modelValue ? labels.widget.collapse : launcherTooltip || labels.widget.expand"
          :aria-label="launcherTooltip || labels.widget.expand"
          @click="toggle"
        />
      </slot>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from "vue";
import EbIcon from "../icon/index.vue"
import EbDrawer from "../drawer/index.vue"
import EbFloatButton from "../float-button/index.vue"
import { useFocusTrap } from "../../composables/useFocusTrap";
import { useLockScroll } from "../../composables/useLockScroll";
import { usePlatform } from "../../composables/usePlatform";
import { chatLabels as labels } from "../chatbot/labels";
const props = defineProps({
  /** 展开态（v-model） */
  modelValue: { type: Boolean, required: false, default: false },
  title: { type: String, required: false, default: "" },
  /** launcher 图标名 */
  icon: { type: String, required: false, default: "customer-service" },
  /** launcher 悬浮提示；展开时自动换成「收起」 */
  launcherTooltip: { type: String, required: false, default: "" },
  /** launcher 角标，null 不显示 */
  badge: { type: Number, required: false, default: null },
  placement: {
    type: String,
    required: false,
    default: "bottom-right",
    validator: (v) => ["bottom-right", "bottom-left"].includes(v)
  },
  /** 桌面浮层尺寸 */
  width: { type: [String, Number], required: false, default: 380 },
  height: { type: [String, Number], required: false, default: 560 },
  /** 窄屏形态：drawer 底部抽屉 / panel 仍用浮层（小屏自适应用） */
  mobileMode: { type: String, required: false, default: "drawer" },
  /** 移动端抽屉高度 */
  drawerSize: { type: [String, Number], required: false, default: "80%" },
  /** 合规声明：给了就先显示同意门，同意后才渲染默认插槽 */
  disclaimer: { type: String, required: false, default: "" },
  defaultConsented: { type: Boolean, required: false, default: false },
  appendToBody: { type: Boolean, required: false, default: true }
});
const emit = defineEmits(["update:modelValue", "open", "close", "consent"]);
// 根是 fragment（Drawer + Teleport），Vue 无法自动继承 attrs。手动落到两个分支的
// 容器上，否则宿主的 class / style（例如就地定位）会被静默丢弃。
defineOptions({ name: "EbChatWidget", inheritAttrs: false });
const { isMobile } = usePlatform();
const useDrawer = computed(() => isMobile.value && props.mobileMode === "drawer");

const panelRef = ref(null);
const consentGiven = ref(props.defaultConsented);
const needConsent = computed(() => !!props.disclaimer && !consentGiven.value);

function sizeOf(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return typeof value === "number" ? `${value}px` : value;
}
const panelStyle = computed(() => ({
  width: sizeOf(props.width, "380px"),
  height: sizeOf(props.height, "560px")
}));

const { lock, unlock } = useLockScroll();
// Esc 走 trap 的 onEscape：它在激活期监听 document，不依赖焦点已落在面板内
const focusTrap = useFocusTrap(panelRef, { onEscape: () => close() });

function toggle() {
  emit("update:modelValue", !props.modelValue);
}
function close() {
  emit("update:modelValue", false);
}
function accept() {
  consentGiven.value = true;
  emit("consent");
}

// 桌面浮层自己管滚动锁与焦点圈闭；移动端由 Drawer 负责，不能重复锁
watch(
  () => props.modelValue,
  (open) => {
    if (useDrawer.value) return;
    if (open) {
      lock();
      emit("open");
      nextTick(() => focusTrap.activate?.());
    } else {
      unlock();
      focusTrap.deactivate?.();
      emit("close");
    }
  }
);
// 展开中切到窄屏（旋转 / 缩放）时把桌面侧的锁与焦点圈交还，避免两套机制互相打架
watch(useDrawer, (nowDrawer) => {
  if (nowDrawer && props.modelValue) {
    unlock();
    focusTrap.deactivate?.();
  }
});
onBeforeUnmount(() => {
  if (!useDrawer.value) unlock();
});

</script>

<style scoped>

.eb-chat-widget {
  position: fixed;
  z-index: var(--eb-z-index-popper, 2000);
  display: flex;
  flex-direction: column;
  gap: var(--eb-space-3);
}

.eb-chat-widget.is-bottom-right {
  right: var(--eb-space-6);
  bottom: var(--eb-space-6);
  align-items: flex-end;
}

.eb-chat-widget.is-bottom-left {
  left: var(--eb-space-6);
  bottom: var(--eb-space-6);
  align-items: flex-start;
}

.eb-chat-widget__panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-width: calc(100vw - var(--eb-space-8));
  max-height: calc(100vh - 120px);
  border: 1px solid var(--eb-border-color-lighter);
  border-radius: var(--eb-radius-xl);
  background: var(--eb-bg-color);
  box-shadow: var(--eb-shadow-3, var(--eb-shadow-2));
  overflow: hidden;
}

.eb-chat-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--eb-space-2);
  flex-shrink: 0;
  padding: var(--eb-space-3) var(--eb-space-4);
  border-bottom: 1px solid var(--eb-border-color-lighter);
  font-size: var(--eb-font-size-sm);
  font-weight: var(--eb-font-weight-medium);
  color: var(--eb-text-color-primary);
}

.eb-chat-widget__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: none;
  border-radius: var(--eb-radius-sm);
  background: transparent;
  color: var(--eb-text-color-secondary);
  cursor: pointer;
  transition: background-color var(--eb-duration-fast) var(--eb-ease-out);
}

.eb-chat-widget__close:hover {
  background: var(--eb-fill-color);
  color: var(--eb-text-color-primary);
}

.eb-chat-widget__close:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 1px;
}

.eb-chat-widget__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.eb-chat-widget__drawer-body {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.eb-chat-widget__consent {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--eb-space-4);
  padding: var(--eb-space-6);
  text-align: center;
}

.eb-chat-widget__consent-text {
  margin: 0;
  font-size: var(--eb-font-size-sm);
  line-height: 1.7;
  color: var(--eb-text-color-secondary);
}

.eb-chat-widget__consent-btn {
  padding: var(--eb-space-2) var(--eb-space-5);
  border: none;
  border-radius: var(--eb-radius-md);
  background: var(--eb-color-primary);
  color: #fff;
  font-size: var(--eb-font-size-sm);
  font-family: inherit;
  cursor: pointer;
}

.eb-chat-widget__consent-btn:hover {
  background: var(--eb-color-primary-dark-2);
}

.eb-chat-widget__consent-btn:focus-visible {
  outline: 2px solid var(--eb-color-primary);
  outline-offset: 2px;
}

/* 出场方向跟着贴边位置走，从左下弹的从左边推入 */
.eb-chat-widget-panel--bottom-right-enter-active,
.eb-chat-widget-panel--bottom-right-leave-active,
.eb-chat-widget-panel--bottom-left-enter-active,
.eb-chat-widget-panel--bottom-left-leave-active {
  transition: opacity var(--eb-duration-base) var(--eb-ease-out), transform var(--eb-duration-base) var(--eb-ease-out);
}

.eb-chat-widget-panel--bottom-right-enter-from,
.eb-chat-widget-panel--bottom-right-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.eb-chat-widget-panel--bottom-left-enter-from,
.eb-chat-widget-panel--bottom-left-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .eb-chat-widget-panel--bottom-right-enter-active,
  .eb-chat-widget-panel--bottom-right-leave-active,
  .eb-chat-widget-panel--bottom-left-enter-active,
  .eb-chat-widget-panel--bottom-left-leave-active {
    transition: none;
  }
}
</style>
