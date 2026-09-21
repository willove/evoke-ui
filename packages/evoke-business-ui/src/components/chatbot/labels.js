/**
 * Chatbot 家族文案集中层
 *
 * 本批不接 useLocale：locale-packs 守卫要求 7 个语言包键位完全一致，
 * 只给部分包加 chat 键会让未覆盖语言在运行时退回 t() 的路径字符串。
 * 因此所有中文文案收在这一个文件里，后续 i18n 批只需改此文件 + 补 7 个语言包，
 * 不必逐个组件返工。带参文案用函数表达，避免调用侧拼字符串。
 */
export const chatLabels = {
  sender: {
    placeholder: '输入消息...',
    sendOnEnterPlaceholder: '输入消息，按 Enter 发送，Shift+Enter 换行',
    attach: '添加附件',
    dropHint: '松开以上传文件',
    send: '发送',
    stop: '停止生成',
  },
  list: {
    label: '对话消息',
    empty: '暂无对话消息',
    backToBottom: '回到对话底部',
  },
  message: {
    error: '消息发送失败',
    cancelled: '已停止生成',
    edited: '已编辑',
    duration: (text) => `（用时 ${text}）`,
    user: '我',
    assistant: 'AI助手',
    tip: '内容由 AI 生成，仅供参考',
  },
  thinking: {
    pending: '思考中...',
    done: '已深度思考',
    placeholder: '正在思考中...',
  },
  actionbar: {
    group: '消息动作',
    copy: '复制',
    copied: '已复制',
    regenerate: '重新生成',
    edit: '编辑',
  },
  attachments: {
    done: '已上传',
    failed: '上传失败',
    remove: (name) => (name ? `移除附件 ${name}` : '移除附件'),
  },
  markdown: {
    copyCode: '复制代码',
    copied: '已复制',
    citation: (num) => `查看第 ${num} 条来源`,
    footnote: (num) => `查看第 ${num} 条脚注`,
  },
  sources: {
    toggle: (n) => `${n} 个来源`,
    open: '展开来源列表',
    close: '收起来源列表',
  },
  suggestion: {
    group: '推荐追问',
  },
  widget: {
    expand: '打开助手',
    collapse: '收起助手',
    close: '关闭',
    agree: '同意并开始',
  },
  threads: {
    group: '会话列表',
    untitled: '新会话',
    newThread: '新建会话',
    searchPlaceholder: '搜索会话',
    empty: '还没有会话',
    noResult: '没有匹配的会话',
    today: '今天',
    yesterday: '昨天',
    last7: '近 7 天',
    earlier: '更早',
    pinned: '已置顶',
    archived: '已归档',
    showArchived: '显示已归档',
    hideArchived: '隐藏已归档',
    renamed: '重命名',
    more: '更多操作',
    remove: '删除会话',
    pin: '置顶',
    unpin: '取消置顶',
    archive: '归档',
    unarchive: '取消归档',
    renamePlaceholder: '会话名称',
    streaming: '生成中',
    removeConfirm: '确定删除这个会话？',
  },
  tool: {
    pending: '等待执行',
    running: '执行中',
    done: '已完成',
    error: '执行失败',
    fallback: '工具调用',
    group: (n) => `执行了 ${n} 个步骤`,
    args: '参数',
    result: '结果',
    retry: '重试',
  },
  feedback: {
    group: '回答评价',
    up: '有帮助',
    down: '没帮助',
    title: '感谢反馈',
    downTitle: '请告诉我们哪里不对',
    notePlaceholder: '补充说明（可选）',
    submit: '提交',
    cancel: '取消',
    skip: '跳过',
    reasons: ['没有理解问题', '回答不准确', '信息过时', '格式或排版混乱', '太长或太短', '有害或不当内容'],
  },
  engine: {
    sendFailed: '发送失败',
  },
  edit: {
    save: '发送',
    cancel: '取消',
    placeholder: '编辑消息后重新发送',
  },
}
