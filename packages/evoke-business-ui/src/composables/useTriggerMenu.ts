/**
 * useTriggerMenu — 输入框里的触发式菜单（斜杠命令 / @ 提及）
 *
 * 只做「从文本与光标位置算出该不该弹、弹什么、选中后文本变成什么」这件非平凡的事，
 * 不管渲染、不管键盘。渲染交给 EbChatCommandMenu，键盘由输入区的 keydown 转发。
 *
 * 触发规则：
 * - 触发符必须在词首（行首或前面是空白），避免把路径里的 `/`、邮箱里的 `@` 当触发
 * - 光标须在触发符之后、且中间没有空白（有空白说明这个词已经写完了）
 */
import { computed, ref } from "vue";
import type { ComputedRef, Ref } from "vue";

export interface TriggerConfig {
  /** 触发字符 */
  char: string;
  /** 候选项 [{ key, label, desc?, icon? }]；给 key 与 label 即可 */
  items: unknown[];
  /** 插入时用的模板；默认插入 label，{value} 为 label */
  insert?: (item: any) => string;
}

export interface UseTriggerMenuOptions {
  /** 触发配置，可给多个（如 / 与 @ 并存） */
  triggers: TriggerConfig[];
  /** 选中后文本怎么变（默认：把「触发符+查询词」换成 insert 模板 + 一个空格） */
  apply?: (text: string, from: number, to: number, inserted: string) => string;
  /** 上限，默认 8 */
  limit?: number;
}

export function useTriggerMenu(options: UseTriggerMenuOptions): {
  text: Ref<string>;
  caret: Ref<number>;
  active: ComputedRef<TriggerConfig | null>;
  query: ComputedRef<string>;
  items: ComputedRef<any[]>;
  visible: ComputedRef<boolean>;
  highlight: Ref<number>;
  move: (delta: number) => void;
  reset: () => void;
  /** 选中第 index 项，返回新文本与新的光标位置 */
  pick: (index: number) => { text: string; caret: number } | null;
} {
  const text = ref("");
  const caret = ref(0);
  const highlight = ref(0);
  const limit = options.limit ?? 8;

  /** 触发符位置；找不到为 -1 */
  const triggerAt = computed(() => {
    const value = text.value;
    const pos = Math.min(caret.value, value.length);
    for (const config of options.triggers) {
      const char = config.char;
      if (!char) continue;
      // 从光标往前找最近的触发符
      const idx = value.lastIndexOf(char, pos - 1);
      // 必须严格在光标之前：lastIndexOf 的 fromIndex<0 会被当作 0，
      // 于是光标停在行首时也能找到索引 0 的触发符，slice(1,0) 又是空串，
      // 看起来像一个合法的空查询词
      if (idx < 0 || idx >= pos) continue;
      const before = idx === 0 ? "" : value[idx - 1];
      // 词首判定：行首或前面是空白
      if (before && !/\s/.test(before)) continue;
      const between = value.slice(idx + 1, pos);
      // 查询词里不该有空白或换行，否则这个词已经结束
      if (/[\s\n]/.test(between)) continue;
      return { config, index: idx };
    }
    return null;
  });

  const active = computed(() => triggerAt.value?.config ?? null);
  const query = computed(() =>
    triggerAt.value ? text.value.slice(triggerAt.value.index + 1, caret.value) : "",
  );

  const items = computed(() => {
    const config = active.value;
    if (!config) return [];
    const q = query.value.toLowerCase();
    const matched = q
      ? config.items.filter((item: any) =>
          `${item?.key ?? ""}${item?.label ?? ""}`.toLowerCase().includes(q),
        )
      : config.items;
    return matched.slice(0, limit);
  });

  const visible = computed(() => !!active.value && items.value.length > 0);

  function move(delta: number) {
    const total = items.value.length;
    if (!total) return;
    highlight.value = (highlight.value + delta + total) % total;
  }

  function reset() {
    highlight.value = 0;
  }

  function pick(index: number) {
    const config = active.value;
    const item = items.value[index];
    const at = triggerAt.value;
    if (!config || !item || !at) return null;
    const inserted = config.insert ? config.insert(item) : String(item.label ?? item.key ?? "");
    const from = at.index;
    const to = caret.value;
    const next = options.apply
      ? options.apply(text.value, from, to, inserted)
      : `${text.value.slice(0, from)}${inserted} ${text.value.slice(to)}`;
    return { text: next, caret: from + inserted.length + 1 };
  }

  return { text, caret, active, query, items, visible, highlight, move, reset, pick };
}
