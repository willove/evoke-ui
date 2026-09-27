# 设置中心（Backstage）

标题栏「文件」打开全屏设置页：左侧分节导航 + 右侧表单区；主界面只留工作台骨架（分节停靠 + tab 条 + 概览 + 状态栏）。分节、开关与密度三处共用同一份状态——开全屏页、切分节、改开关，画布尺寸一动不动。

<DocExample :code="settingsCaseSource"><SettingsBackstageCase /></DocExample>

## 用到的组件

- [EtBackstage](/components/backstage) —— 全屏设置页：`#nav` 分节 + 内容区，Esc / 返回钮只回写开关
- [EtTitleBar](/components/title-bar) —— 标题栏与 `#quick` 快捷位上的「文件」入口
- [EtWorkbench](/components/workbench) —— 主界面骨架：标题栏 / 工具区 / 停靠 / 画布 / 状态栏
- [EtTabStrip](/components/tab-strip) —— 工具区里的分节 tab 条（与停靠、全屏页 nav 同源）
- [EtSelect](/components/select) · `EbSwitch` · `EbSegmented` —— 表单区三种控件：下拉、开关、分段
- [EtDivider](/components/divider) —— 分节内分块之间的横分隔
- [EtScrollArea](/components/scroll-area) —— 停靠里的分节列表滚动位
- [EtKeyHint](/components/key-hint) —— 快捷键分节的只读键位行
- [EtStatusBar](/components/status-bar) —— 分节 / 密度 / 保存状态 / 画布尺寸四个读数
- [EtToast](/components/toast) —— 保存与恢复默认的反馈位

## 实现要点

- **开关不引发画布跳动**：`EtBackstage` Teleport 到 body、挂载点只留零尺寸锚点、锁滚动用计数式 class 补偿滚动条——状态栏的「画布」读数在反复开关全屏页时保持不变（案例实测的就是这条 M3 验收）。
- **同一个分节三处可达**：停靠列表、工具区 tab 条、全屏页 nav 都读写 `section`，切一处另两处跟着高亮——不是三份状态同步，是一份状态三个渲染面。
- **`enabled` 从 ctx 推演**：`dirty`（当前值 vs 上次保存）决定「保存 / 恢复默认」是否可点；保存只推进基线，不写第二份状态。
- **密度是真换档**：外观分节的密度档经 `EtProvider` 写 `<html data-density>`，chrome 高度与画布令牌一起切；离开页面时还原挂载前的值。
- **表单不上表格**：行是 `div` 网格（标签 + 说明 + 控件），分块之间用 `EtDivider`；「高级选项」默认折叠，展开才渲染追加行。

想看列表型界面，对照[邮件工作台](/examples/mail-workspace)；办公旗舰装配见[电子表格工作台](/examples/sheet-workbench)。

<script setup>
import SettingsBackstageCase from './cases/SettingsBackstageCase.vue'
import settingsCaseSource from './cases/SettingsBackstageCase.vue?raw'
</script>