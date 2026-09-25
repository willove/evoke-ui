/**
 * 会话事件日志 —— 可修复的增量窗口（对标 DSH 的 durable log + 游标补齐）
 *
 * 组件族默认的接法是宿主在 `onSend` 里自己回写引擎；那套接法在「断线、切会话、
 * 补历史」时会丢状态，因为没有任何东西记得"我读到哪了"。本模块补上这一层：
 *
 *   事件信封：{ type, seq, time, data, ignorable?, surfaceOp? }
 *
 * 三条不变量（违反即上报，绝不静默硬接）：
 *   1. **连续性**：`seq` 必须严格等于上一个 +1。跳号 → 进入 repairing，挂起后到的事件，
 *      由宿主补页（`repair`）填平后才继续应用。事件顺序永不倒置。
 *   2. **游标只被持久事件推进**：瞬时通知（显式 `transient: true`）走 `onTransient`，
 *      不碰游标、不进窗口；没有 seq 又没有该标记的，按坏信封上报。
 *   3. **恢复不倒退**：调用 `beginGeneration()` 标记一次新的订阅（重连/重开），此后若服务端
 *      从更早的 seq 重放，属于协议违规（`stale-replay`）——DSH 同样把这种情形判为违规，
 *      因为静默接受会让窗口出现重影。
 *
 * 未知事件类型按 `ignorable` 决定：`ignorable: true` 可安全跳过；否则上报 `unknown-event`，
 * 由宿主决定是否降级重拉整窗（不认识的事件可能携带视图状态，跳过会画错）。
 *
 * 本模块不依赖 Vue，可单测、也可给别的框架复用；Vue 侧封装见 useChatSession。
 */

/** 判定是否事件信封（持久事件必须有 type 与数字 seq） */
function isEnvelope(entry) {
  return !!entry
    && typeof entry === "object"
    && typeof entry.type === "string"
    && typeof entry.seq === "number"
    && Number.isFinite(entry.seq);
}

/** 是否为瞬时通知：必须显式 `transient: true`（没有 seq 不等于瞬时，可能是坏信封） */
function isTransient(entry) {
  return !!entry && typeof entry === "object" && entry.transient === true;
}

export function createSessionLog(options = {}) {
  const onViolation = options.onViolation;
  const onGap = options.onGap;
  const onTransient = options.onTransient;

  let applied = [];
  let cursor = 0;
  let repairing = false;
  let pending = [];
  let generation = 0;
  /** 新代刚开、第一条事件落地前为真：此时任何"已在游标之后"的重放都算倒退 */
  let strictResume = false;
  const violations = [];
  const subscribers = new Set();

  function snapshot() {
    return { entries: applied, cursor, repairing, pendingCount: pending.length, generation, violations };
  }

  function notify() {
    const state = snapshot();
    for (const fn of subscribers) fn(state);
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  function violate(code, detail) {
    const row = { code, detail: detail ?? null, at: Date.now() };
    violations.push(row);
    onViolation?.(row);
    return false;
  }

  /** 组装一个持久事件（宿主按 wire 数据构造） */
  function entryOf(type, data, meta = {}) {
    return {
      type,
      seq: meta.seq,
      time: meta.time ?? Date.now(),
      data: data ?? null,
      ...(meta.ignorable ? { ignorable: true } : {}),
      ...(meta.surfaceOp ? { surfaceOp: meta.surfaceOp } : {}),
    };
  }

  /** 应用快照：打开/重拉时的整窗替换。records 必须连续升序，且以 cursor 收尾 */
  function install(input = {}) {
    const records = Array.isArray(input.records) ? input.records : [];
    const nextCursor = typeof input.cursor === "number" ? input.cursor : (records.length ? records[records.length - 1].seq : 0);
    applied = records.filter(isEnvelope).slice().sort((a, b) => a.seq - b.seq);
    cursor = nextCursor || (applied.length ? applied[applied.length - 1].seq : 0);
    pending = [];
    repairing = false;
    strictResume = true; // 快照之后的第一条必须紧接游标
    notify();
    return snapshot();
  }

  /** 标记一次新的订阅代（重连/重开）：之后重放旧 seq 视为违规 */
  function beginGeneration() {
    generation += 1;
    strictResume = true;
    return generation;
  }

  function flushPending() {
    // 挂起的事件按 seq 升序、只吃与游标相邻的，直到断口再次出现
    pending.sort((a, b) => a.seq - b.seq);
    while (pending.length && pending[0].seq === cursor + 1) {
      applied = [...applied, pending.shift()];
      cursor += 1;
    }
    if (pending.length === 0) repairing = false;
  }

  /**
   * 应用一条事件。
   * 返回 "applied" | "duplicate" | "buffered" | "transient" | "violation" | false
   */
  function apply(entry) {
    if (isTransient(entry)) {
      onTransient?.(entry);
      return "transient";
    }
    if (!isEnvelope(entry)) {
      violate("bad-envelope", entry);
      return "violation";
    }
    if (entry.seq <= cursor) {
      // 新代刚开、第一条事件之前：服务端从更早的 seq 重放 = 协议违规（DSH 同判）；
      // 同一代内的重复投递则是幂等的，静默丢
      if (strictResume) {
        violate("stale-replay", entry);
        return "violation";
      }
      return "duplicate";
    }
    if (entry.seq === cursor + 1) {
      strictResume = false;
      applied = [...applied, entry];
      cursor = entry.seq;
      const wasRepairing = repairing;
      if (pending.length) flushPending();
      if (!pending.length && wasRepairing) repairing = false;
      notify();
      return "applied";
    }
    // 跳号：挂起 + 请宿主补页，绝不越序应用
    pending = [...pending, entry].filter((e, i, arr) => arr.findIndex((x) => x.seq === e.seq) === i);
    if (!repairing) {
      repairing = true;
      onGap?.({ from: cursor + 1, to: entry.seq - 1, cursor });
    }
    notify();
    return "buffered";
  }

  function applyBatch(entries = []) {
    const result = [];
    for (const entry of entries) result.push(apply(entry));
    return result;
  }

  /**
   * 缺口补齐：把宿主 `page(from, to)` 拿回的记录并回窗口。
   * 只接受从 `cursor + 1` 开始的连续段；重复记录丢弃；不合规上报 `bad-page`。
   */
  function repair(records = []) {
    const rows = records.filter(isEnvelope).slice().sort((a, b) => a.seq - b.seq);
    if (!rows.length) {
      if (repairing) violate("empty-page", { cursor, pending: pending.length });
      return snapshot();
    }
    const seen = new Set(applied.map((e) => e.seq));
    for (const row of rows) {
      if (row.seq <= cursor || seen.has(row.seq)) continue; // 重叠段：幂等丢弃
      if (row.seq !== cursor + 1) {
        violate("bad-page", { expected: cursor + 1, got: row.seq });
        return snapshot();
      }
      applied = [...applied, row];
      cursor = row.seq;
      seen.add(row.seq);
    }
    if (pending.length) flushPending();
    if (!pending.length) repairing = false;
    notify();
    return snapshot();
  }

  /**
   * 未知事件的兜底：宿主不认识某个 type 时问这里要不要跳过。
   * 不可忽略 → 上报并返回 false，调用方应重拉整窗。
   */
  function acceptUnknown(entry) {
    if (entry?.ignorable) return true;
    violate("unknown-event", entry?.type ?? entry);
    return false;
  }

  function reset() {
    applied = [];
    cursor = 0;
    pending = [];
    repairing = false;
    violations.length = 0;
    notify();
  }

  return {
    subscribe,
    snapshot,
    entryOf,
    install,
    apply,
    applyBatch,
    repair,
    acceptUnknown,
    beginGeneration,
    reset,
    get entries() { return applied; },
    get cursor() { return cursor; },
    get repairing() { return repairing; },
    get pending() { return pending; },
  };
}

export { isEnvelope, isTransient };