<template>
  <!--
    纯透传：把 messagePropsFor 的 props 束与 rowListeners 的事件束整包转给 ChatMessage，
    再把三条正文级插槽往下带。

    刻意不枚举事件——枚举就会漏（漏了是静默失效，加新事件还要改两处）。
    inheritAttrs:false 让 $attrs 同时装着 props 与 onXxx，v-bind 一次绑完。
  -->
  <ChatMessage v-bind="$attrs">
    <template v-if="$slots.content" #content="p">
      <slot name="content" v-bind="p" />
    </template>
    <template v-if="$slots['tool-result']" #tool-result="p">
      <slot name="tool-result" v-bind="p" />
    </template>
    <template v-if="$slots['tool-args']" #tool-args="p">
      <slot name="tool-args" v-bind="p" />
    </template>
  </ChatMessage>
</template>

<script setup>
import ChatMessage from "./ChatMessage.vue";
defineOptions({ name: "EbChatMessageRow", inheritAttrs: false });
</script>
