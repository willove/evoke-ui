# ImportExportPanel 导入导出面板

批量导入与数据导出的双分区面板。组件本身不执行网络 IO：选择文件后 emit `import-file`、点击格式按钮 emit `export`，由消费方完成上传/导出后调用 `done(kind)` 收尾。

状态流转：

- 选择文件后面板进入导入中（按钮显示导入中并禁用重复选择），移除文件会自动复位；
- 点击任一导出按钮后导出按钮组整体禁用；
- 两种状态都只能由消费方调用 `done('import' | 'export')` 结束——校验失败要立即 `done('import')`，否则按钮一直转圈。

## 基础用法

<DemoBlock>
  <ev-import-export-panel
    style="width: 100%;"
    import-tip="仅支持 .xlsx / .csv，单次 5000 行以内"
    export-tip="导出内容为当前筛选结果"
    template-name="导入模板.xlsx"
    @import-file="() => {}"
    @export="() => {}"
    @download-template="() => {}"
  />
</DemoBlock>

<script setup>
import { ref } from 'vue'
const iepRef = ref(null)
const iepLog = ref('等待选择文件…')
function onIepImport(file) {
  const ok = /\.(xlsx|xls|csv)$/i.test(file.name)
  if (!ok || file.size > 5 * 1024 * 1024) {
    iepLog.value = '校验失败：仅支持 5MB 内的 xlsx / xls / csv，已拒绝 ' + file.name
    iepRef.value.done('import')
    return
  }
  iepLog.value = '已接收 ' + file.name + '，解析中…'
  setTimeout(() => {
    iepRef.value.done('import')
    iepLog.value = '导入完成：' + file.name
  }, 800)
}
function onIepExport(format) {
  iepLog.value = '导出 ' + format + ' 中…'
  setTimeout(() => {
    iepRef.value.done('export')
    iepLog.value = '已导出 ' + format.toUpperCase() + ' 文件'
  }, 800)
}
</script>

## 导入回调与错误处理

完整闭环示例：`import-file` 的参数是文件描述对象 `{ name, size, raw }`；先做类型/大小校验，失败立即 `done('import')` 复位，成功则模拟上传后再收尾。

<DemoBlock>
  <ev-import-export-panel
    ref="iepRef"
    style="width: 100%;"
    import-tip="仅支持 .xlsx / .csv，单次 5000 行以内"
    template-name="导入模板.xlsx"
    @import-file="onIepImport"
    @export="onIepExport"
    @download-template="() => {}"
  />
  <p style="margin-top: 8px;">{{ iepLog }}</p>
</DemoBlock>

## 自定义文案与格式按钮

`formats` 声明导出格式按钮组（默认 `[xlsx, csv]`），`default-format` 高亮默认项；`accept`、`import-button-text`、分区标题都可定制，例如改成压缩包素材导入。

<DemoBlock>
  <ev-import-export-panel
    style="width: 100%;"
    import-title="素材导入"
    import-button-text="上传素材包"
    import-tip="支持 .zip 压缩包，单个 100MB 以内"
    accept=".zip"
    export-title="素材导出"
    :formats="['json', 'csv', 'xlsx']"
    default-format="json"
    @import-file="() => {}"
    @export="() => {}"
  />
</DemoBlock>

## 导出区扩展内容

`export-extra` 插槽渲染在导出按钮组下方，适合补充导出范围说明或后台任务提示。

<DemoBlock>
  <ev-import-export-panel
    style="width: 100%;"
    export-tip="导出内容为当前筛选结果"
    @export="() => {}"
  >
    <template #export-extra>
      <p style="margin: 8px 0 0;">超过 10 万行将自动转为后台任务，完成后站内通知。</p>
    </template>
  </ev-import-export-panel>
</DemoBlock>

## API

<ApiTable title="ImportExportPanel Props" :rows="[
  { name: 'importTitle / exportTitle', desc: '分区标题', type: 'string', default: '批量导入 / 数据导出' },
  { name: 'importTip / exportTip', desc: '分区说明文案', type: 'string', default: '' },
  { name: 'importButtonText', desc: '选择文件按钮文案', type: 'string', default: '选择文件' },
  { name: 'action', desc: '上传地址（空则由 import-file 事件处理）', type: 'string', default: '' },
  { name: 'accept', desc: '文件类型限制', type: 'string', default: '.xlsx,.xls,.csv' },
  { name: 'autoUpload', desc: '选择后立即上传', type: 'boolean', default: 'false' },
  { name: 'templateName', desc: '模板名（非空显示下载模板按钮）', type: 'string', default: '' },
  { name: 'formats', desc: '导出格式按钮', type: 'string[]', default: '[xlsx, csv]' },
  { name: 'defaultFormat', desc: '默认高亮格式', type: 'string', default: 'xlsx' },
]" />

<ApiTable title="Slots" :rows="[
  { name: 'export-extra', desc: '导出按钮组下方的扩展内容', type: '—', default: '—' },
]" />

<ApiTable title="Events" :rows="[
  { name: 'import-file', desc: '选择文件后触发，参数为 { name, size, raw } 等文件描述对象', type: '(file) => void', default: '—' },
  { name: 'export', desc: '点击导出格式按钮', type: '(format: string) => void', default: '—' },
  { name: 'download-template', desc: '点击下载模板', type: '() => void', default: '—' },
]" />

<ApiTable title="Methods" :rows="[
  { name: 'done', desc: 'IO 完成收尾；done(import) 复位导入按钮，done(export) 恢复导出按钮组', type: '(kind?: import | export) => void', default: 'import' },
]" />
