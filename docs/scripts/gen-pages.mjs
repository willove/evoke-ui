/**
 * 基础组件文档页批量生成
 * 有精选内容的组件（KEY_PAGES）生成"单演示 + API 表"页；
 * 其余侧栏组件生成规范占位页（标题 + 说明 + 文档建设提示）。
 *
 * 用法: node scripts/gen-pages.mjs   （在 evoke-business-ui-docs 下执行）
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ALL_COMPONENTS } from '../.vitepress/theme/meta.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PAGES_DIR = resolve(__dirname, '../components')
mkdirSync(PAGES_DIR, { recursive: true })

/** 精写页：{ 演示模板, 属性表 } —— 每组件一段可运行的模板 + props 表 */
const KEY_PAGES = {
  Button: {
    demo: `<ev-button>默认按钮</ev-button>
<ev-button type="primary">主要按钮</ev-button>
<ev-button type="danger">危险按钮</ev-button>
<ev-button type="primary" plain>朴素按钮</ev-button>
<ev-button type="primary" round>圆角按钮</ev-button>
<ev-button type="primary" icon="search">搜索</ev-button>
<ev-button type="primary" disabled>禁用</ev-button>`,
    props: [
      ['type', '按钮类型', "'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'", "'default'"],
      ['size', '尺寸', "'small' | 'default' | 'large'", "'default'"],
      ['plain / round / circle', '朴素 / 圆角 / 圆形', 'boolean', 'false'],
      ['disabled / loading', '禁用 / 加载', 'boolean', 'false'],
      ['icon', '图标名（registry）', 'string', "''"],
    ],
  },
  Input: {
    demo: `<ev-input v-model="v" placeholder="请输入内容" clearable />
<ev-input type="textarea" :rows="3" placeholder="多行输入" />`,
    props: [
      ['v-model', '绑定值', 'string | number', "''"],
      ['type', '类型（textarea 呈多行）', 'string', "'text'"],
      ['placeholder', '占位文本', 'string', "''"],
      ['clearable', '可清空', 'boolean', 'true'],
      ['disabled', '禁用', 'boolean', 'false'],
      ['error / help', '校验错误与提示文案', 'string', "''"],
    ],
  },
  Select: {
    demo: `<ev-select v-model="v" placeholder="请选择" style="width: 200px;">
  <ev-option label="华东" value="east" />
  <ev-option label="华南" value="south" />
</ev-select>`,
    props: [
      ['v-model', '绑定值', 'string | number | array', "''"],
      ['multiple', '多选', 'boolean', 'false'],
      ['filterable', '可搜索', 'boolean', 'false'],
      ['clearable', '可清空', 'boolean', 'true'],
      ['disabled', '禁用', 'boolean', 'false'],
      ['placeholder', '占位文本', 'string', "'请选择'"],
    ],
  },
  Table: {
    demo: `<ev-table :data="rows" border stripe>
  <ev-table-column prop="name" label="名称" />
  <ev-table-column prop="owner" label="负责人" />
  <ev-table-column prop="amount" label="金额" align="right" sortable />
</ev-table>`,
    props: [
      ['data', '表格数据', 'array', '[]'],
      ['border / stripe', '边框 / 斑马纹', 'boolean', 'false'],
      ['height / maxHeight', '固定高度（表头吸顶）', 'number | string', '—'],
      ['rowKey', '行键', 'string | function', '—'],
      ['showSummary / summaryMethod', '表尾合计', 'boolean / function', 'false'],
    ],
  },
  Pagination: {
    demo: `<ev-pagination :model-value="{ page: 1, size: 10 }" :total="120" />`,
    props: [
      ['v-model', '对象 { page, size } 或页码数字', 'object | number', 'null'],
      ['total', '总条数', 'number', '0'],
      ['pageSize', '每页条数', 'number', '—'],
      ['pageSizes', '可选每页条数', 'number[]', '[10, 20, 50, 100]'],
      ['layout', '布局', 'string', "'total, sizes, prev, pager, next, jumper'"],
    ],
  },
  Dialog: {
    demo: `<ev-button type="primary" @click="visible = true">打开对话框</ev-button>
<ev-dialog v-model="visible" title="标题" width="480px">
  <p>对话框内容</p>
  <template #footer>
    <ev-button @click="visible = false">取消</ev-button>
    <ev-button type="primary" @click="visible = false">确定</ev-button>
  </template>
</ev-dialog>`,
    props: [
      ['v-model', '显示控制', 'boolean', 'false'],
      ['title', '标题', 'string', "''"],
      ['width', '宽度', 'string | number', "'520px'"],
      ['fullscreen', '全屏', 'boolean', 'false'],
      ['closeOnClickModal', '点遮罩关闭', 'boolean', 'true'],
      ['closeOnPressEscape', 'ESC 关闭', 'boolean', 'true'],
      ['beforeClose', '关闭前拦截', '(done) => void', '—'],
    ],
  },
  Message: {
    demo: `<ev-button @click="$message('普通提示')">消息</ev-button>
<ev-button @click="$message.success('操作成功')">成功</ev-button>
<ev-button @click="$message.warning('请注意')">警告</ev-button>
<ev-button @click="$message.error('操作失败')">错误</ev-button>`,
    props: [
      ['message', '文本或 VNode', 'string | vnode | options', "''"],
      ['type', '类型', "'info' | 'success' | 'warning' | 'error'", "'info'"],
      ['duration', '显示时长（0 不自动关闭）', 'number', '3000'],
      ['showClose', '显示关闭按钮', 'boolean', 'false'],
    ],
  },
}

function stubPage(comp) {
  const key = comp.name
  if (KEY_PAGES[key]) {
    const p = KEY_PAGES[key]
    const propsTable = p.props
      .map((r) => `  { name: '${r[0]}', desc: '${r[1]}', type: '${r[2]}', default: '${r[3]}' },`)
      .join('\n')
    return `# ${key} ${comp.zh}

<DemoBlock :code="\`${p.demo.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`">
${p.demo}
</DemoBlock>

<ApiTable title="${key} Props" :rows="[
${propsTable}
]" />
`
  }
  return `# ${key} ${comp.zh}

${comp.name} 组件的完整文档编写中。当前可参考源码注释（src/components/）与 Props 定义使用。

> 侧栏其余组件文档将按使用频次陆续补齐。
`
}

let written = 0
for (const comp of ALL_COMPONENTS) {
  const slug = comp.name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  const file = resolve(PAGES_DIR, `${slug}.md`)
  if (existsSync(file)) continue
  writeFileSync(file, stubPage(comp))
  written++
}
console.log(`[gen-pages] 生成 ${written} 页（已有页跳过）`)
