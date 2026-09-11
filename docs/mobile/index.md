# 移动端适配

同一套组件库与主题令牌直接服务移动端 H5：不做独立分支构建，也不引入第二套组件，适配发生在**页面范式层**——桌面多栏退化为单列信息流、hover 交互让位给点按、宽表格转译为卡片列表、弹层从屏幕中央移到拇指易达的底部。本区逐类给出常见桌面组件的移动表达与可复制的容器规范，所有演示都运行在真实组件上，可直接对照取用。

## 设计原则

1. **单列信息流**。桌面的多栏栅格与宽表格在移动端一律退化为纵向卡片流，一屏只承载一个主任务；跨两栏才能读完整的字段对，在窄屏上必须拆成主副两行。
2. **触控优先**。可点目标不小于 44×44px，横向相邻控件间距不小于 8px；`hover` 态在触屏上不可依赖，全部改由点按反馈（按压态、结果提示）承担。
3. **操作置底**。页面级入口进底部标签栏，对象级操作进底部动作面板，表单主按钮吸底——拇指热区在屏幕下三分之一，操作动线自上而下单向收束。
4. **输入轻量化**。能选不输：状态筛选用分段器，枚举字段用底部选择面板，日期用面板点选；自由文本尽量后置到「备注」类可选项。
5. **信息降噪**。每张卡片保留「1 主行 + 1 副行 + 1 状态」，次要字段沉到详情页；移动端宁可在列表页少给一个字段，也不让卡片折成三行。

## 视口与安全区

页面壳按「真机全宽、桌面居中」双向兼容：

```css
.mb-shell {
  max-width: 420px;   /* 桌面浏览器预览时呈现为居中手机列 */
  margin: 0 auto;
  min-height: 100dvh; /* 真机动态视口，规避地址栏收展抖动 */
}
```

底部吸底元素（标签栏、提交栏）通过 `env(safe-area-inset-bottom)` 适配全面屏安全区；顶部导航栏同理预留状态栏高度。组件层面已自动覆盖：Tabbar（吸底 + `safe-area-inset-bottom` 默认开启）与 ActionSheet（取消栏下缘）内置适配；业务自有的吸底元素用 `useSafeArea()` 读取实时 insets，页面初始化时调用一次 `ensureViewportFit()`（viewport 缺 `viewport-fit=cover` 时 `env()` 恒为 0，函数自动补上）。完整页面壳与底部标签栏的实现见 [布局与导航壳](/mobile/layout)，或直接参考可运行的 [移动端 H5 样板](/examples/mobile)。

## 演示壳 MobileStage

本区所有演示放在 `MobileStage` 舞台中呈现：375px 视口 + 状态栏 / 应用导航栏 / Home 指示条，组件在其中的表现即真机表现。

```html
<MobileStage title="订单列表">
  <!-- 页面内容 -->
  <template #bottom>
    <!-- 底部标签栏（可选） -->
  </template>
</MobileStage>
```

**舞台内弹层的口径**：弹层类组件（Dialog / Drawer）在舞台内必须声明 `:append-to-body="false"`。舞台屏幕层带有 `transform`，内联弹层的 `position: fixed` 会以屏幕为包含块，被完整裁剪在「手机」内而不是铺满文档页。真机页面无此限制，保持默认（Teleport 到 body）即可。

<DemoBlock>
<MobileStage title="工作台">
  <div class="mb-page">
    <div class="mb-greet">早上好，李工</div>
    <div class="mb-sub">9 月 8 日 星期二 · 有 3 个待办</div>
    <div class="mb-stats">
      <div class="mb-stat"><span class="mb-stat__label">本月报销（元）</span><span class="mb-stat__value">12,480</span></div>
      <div class="mb-stat"><span class="mb-stat__label">待我审批</span><span class="mb-stat__value">6</span></div>
      <div class="mb-stat"><span class="mb-stat__label">进行中项目</span><span class="mb-stat__value">4</span></div>
      <div class="mb-stat"><span class="mb-stat__label">未读消息</span><span class="mb-stat__value">12</span></div>
    </div>
    <div class="mb-card">
      <eb-cell-stack main="差旅报销单 CL-0908-01" sub="¥1,860 · 待审批" />
      <eb-cell-stack main="服务器扩容审批" sub="张三提交于 10:24" />
      <eb-cell-stack main="9 月迭代排期确认" sub="今天 14:00 · 会议邀请" />
    </div>
  </div>
  <template #bottom>
    <div class="mb-tabbar">
      <div class="mb-tabbar__item is-active"><BdIcon name="home" :size="20" /><span>首页</span></div>
      <div class="mb-tabbar__item"><BdIcon name="box" :size="20" /><span>应用</span></div>
      <div class="mb-tabbar__item"><BdIcon name="book" :size="20" /><span>消息</span><i class="mb-tabbar__badge">12</i></div>
      <div class="mb-tabbar__item"><BdIcon name="grid" :size="20" /><span>我的</span></div>
    </div>
  </template>
</MobileStage>
</DemoBlock>

## 桌面 → 移动 适配速查表

| 桌面场景 | 移动表达 | 说明 |
| --- | --- | --- |
| DataTable / Table 宽表格 | 卡片列表 | 主行 = 业务主键 + 状态，副行 = 金额 / 时间，点按进详情，见[数据展示](/mobile/data-display) |
| Dialog 模态框 | 底部动作面板 / 全屏页 | 确认与轻操作用底部面板，长表单用全屏，见[反馈与浮层](/mobile/feedback) |
| Drawer 右侧抽屉 | `direction="btt"` 底部面板 | `size` 从宽度换算为高度，见[反馈与浮层](/mobile/feedback) |
| Select / Cascader 下拉 | 底部选择面板 | 列表点选替代 popper，见[数据录入](/mobile/data-entry) |
| DatePicker 日历弹层 | 底部日历面板 | 同上，面板内点选日期 |
| Menu / Breadcrumb | 底部标签栏 + 返回栏 | 层级压平，页标题即位置，见[页面导航](/mobile/navigation) |
| Pagination 页码器 | 加载更多 / 触底加载 | 窄屏上页码跳转无意义，见[页面导航](/mobile/navigation) |
| Form 右侧标签 | `label-position="top"` | 窄屏标签上置，主按钮吸底，见[数据录入](/mobile/data-entry) |
| Tooltip / Popover（hover） | 内联展示或详情页 | 触屏无 hover，关键信息直接进卡片或详情 |
| Tabs 超宽页签 | 横向滚动页签 | Tabs 已支持窄容器自动横滑，见[页面导航](/mobile/navigation) |
| 手写底部动作列表 | ActionSheet 组件 | 下拉刷新 / 加载更多 / 动作面板 / 底部标签栏均已组件化，见各组件文档 |

## 移动专属组件

五个移动端高频能力已组件化，与前台库 evoke-ui 的 Ew 版本同名同 API，跨端范式一致：

| 组件 | 场景 | 文档 |
| --- | --- | --- |
| NavBar 页头 | H5 页面头部：返回 + 标题 + 动作 | [组件文档](/mobile/components/nav-bar) |
| PullRefresh 下拉刷新 | 内容流顶部，对齐原生 App 手感 | [组件文档](/mobile/components/pull-refresh) |
| LoadMore 加载更多 | 列表尾部，点击或触底自动加载 | [组件文档](/mobile/components/load-more) |
| ActionSheet 动作面板 | 对象级操作菜单 | [组件文档](/mobile/components/action-sheet) |
| Tabbar 底部标签栏 | 一级导航吸底 + 安全区 | [组件文档](/mobile/components/tabbar) |

## 与完整示例的关系

本区关注**单点范式**：每页解决一类组件的移动表达。要找一个可以整体参考、直接跑起来的页面，见示例区的[移动端 H5 工作台](/examples/mobile)——四页签 + 安全区适配 + 简单模式开关的完整样板，与本区的规范完全一致。
