/**
 * useChatSessions — 多会话编排
 *
 * 每个 thread 持有一个独立的 useChatEngine 实例：切走只是不渲染，回答继续流，
 * 回来内容还在（「边问边翻历史」是常见操作，切走即中断会让它不可用）。
 *
 * 与家族其余部分一致：不发请求、不落存储。transport 由宿主注入，
 * 持久化由宿主经 snapshot() 取走 / 经 initialThreads 灌回。
 */
import { ref, computed, watch } from "vue";
import { useChatEngine } from "./useChatEngine";
import { generateId } from "./utils";
import { chatLabels as labels } from "./labels";

const DEFAULT_TITLE_LIMIT = 24;

export function useChatSessions(options = {}) {
  const titleOf = options.titleOf || ((text) => {
    const clean = String(text || "").replace(/\s+/g, " ").trim();
    if (!clean) return labels.threads.untitled;
    return clean.length > DEFAULT_TITLE_LIMIT ? `${clean.slice(0, DEFAULT_TITLE_LIMIT)}…` : clean;
  });

  const threads = ref(
    (options.initialThreads || []).map((t) => normalizeThread(t))
  );
  const activeId = ref(options.activeId || threads.value[0]?.id || "");
  /** 同时处于生成中的 thread 数上限；0 为不限 */
  const maxConcurrentStreaming = ref(options.maxConcurrentStreaming ?? 0);

  // 引擎实例挂在普通 Map 上：它们自身持有响应式 ref，不需要再被代理一层
  const engines = new Map();

  function normalizeThread(raw) {
    const now = Date.now();
    return {
      id: raw.id || generateId(),
      title: raw.title || "",
      createdAt: raw.createdAt ?? now,
      updatedAt: raw.updatedAt ?? now,
      pinned: !!raw.pinned,
      archived: !!raw.archived,
      unread: raw.unread ?? 0
    };
  }

  function engineOf(id) {
    const thread = threads.value.find((t) => t.id === id);
    if (!thread) return null;
    if (!engines.has(id)) {
      const seed = (options.initialThreads || []).find((t) => t.id === id);
      engines.set(
        id,
        useChatEngine({
          initialMessages: seed?.messages || [],
          onSend: (...args) => options.transport?.(...args, { threadId: id })
        })
      );
    }
    return engines.get(id);
  }

  const active = computed(() => threads.value.find((t) => t.id === activeId.value) || null);
  const activeEngine = computed(() => (activeId.value ? engineOf(activeId.value) : null));
  const visible = computed(() => threads.value.filter((t) => !t.archived));
  const archived = computed(() => threads.value.filter((t) => t.archived));
  const streamingIds = computed(() =>
    threads.value.filter((t) => engineOf(t.id)?.loading.value).map((t) => t.id)
  );

  function emitChange(thread, reason) {
    options.onChange?.(thread, reason);
  }

  /**
   * bump 只在真的产生新消息时用：选中 / 改名 / 置顶都推进 updatedAt 的话，
   * 列表会按「最近点过」重排——用户刚点的条目在指针底下跳走。
   */
  function touch(id, patch = {}, reason = "update", { bump = false } = {}) {
    const list = threads.value;
    const idx = list.findIndex((t) => t.id === id);
    if (idx < 0) return null;
    const next = { ...list[idx], ...patch };
    if (bump) next.updatedAt = Date.now();
    list[idx] = next;
    emitChange(next, reason);
    return next;
  }

  function select(id) {
    if (!threads.value.some((t) => t.id === id)) return;
    activeId.value = id;
    touch(id, { unread: 0 }, "select");
  }

  function create(seed = []) {
    const thread = normalizeThread({ title: seed.title || "", id: seed.id });
    threads.value = [thread, ...threads.value];
    engines.set(
      thread.id,
      useChatEngine({
        initialMessages: seed.messages || [],
        onSend: (...args) => options.transport?.(...args, { threadId: thread.id })
      })
    );
    activeId.value = thread.id;
    emitChange(thread, "create");
    return thread.id;
  }

  function rename(id, title) {
    return touch(id, { title }, "rename");
  }

  function pin(id, value = true) {
    return touch(id, { pinned: value }, "pin");
  }

  function archive(id, value = true) {
    return touch(id, { archived: value }, "archive");
  }

  function remove(id) {
    const idx = threads.value.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const [gone] = threads.value.splice(idx, 1);
    engines.delete(id);
    if (activeId.value === id) {
      activeId.value = threads.value[0]?.id || "";
    }
    emitChange(gone, "remove");
  }

  /** 当前是否允许在某个 thread 上发起生成（并发上限用满时拒绝） */
  function canSendOn(id) {
    if (engines.get(id)?.loading.value) return false;
    const limit = maxConcurrentStreaming.value;
    if (!limit) return true;
    return streamingIds.value.filter((sid) => sid !== id).length < limit;
  }

  function send(text, attachments = [], context) {
    const id = activeId.value;
    const engine = id ? engineOf(id) : null;
    if (!engine) return false;
    if (!canSendOn(id)) {
      options.onReject?.({ threadId: id, reason: "concurrency" });
      return false;
    }
    const thread = threads.value.find((t) => t.id === id);
    const wasUntitled = !thread?.title;
    engine.sendMessage(text, attachments, context);
    if (wasUntitled && String(text || "").trim()) {
      rename(id, titleOf(text));
    }
    touch(id, {}, "update", { bump: true });
    return true;
  }

  function stop() {
    return activeEngine.value ?? null;
  }

  /** 取走可持久化的快照：thread 元数据 + 各自的消息数组 */
  function snapshot() {
    return threads.value.map((t) => ({
      ...t,
      messages: engineOf(t.id)?.messages.value ?? []
    }));
  }

  function clear() {
    threads.value = [];
    engines.clear();
    activeId.value = "";
  }

  // 选中项没了（被删或清空）时兜底，避免 activeEngine 悬空
  watch(threads, (list) => {
    if (!list.some((t) => t.id === activeId.value)) {
      activeId.value = list[0]?.id || "";
    }
  });

  return {
    threads,
    visible,
    archived,
    activeId,
    active,
    activeEngine,
    streamingIds,
    maxConcurrentStreaming,
    engineOf,
    select,
    create,
    rename,
    pin,
    archive,
    remove,
    send,
    stop,
    canSendOn,
    snapshot,
    clear
  };
}
