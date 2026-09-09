# Keycap 键帽

`EwKeycap` 以键帽的视觉形态展示键盘快捷键，常用于产品说明文案与帮助提示，例如
「按 <kbd>c</kbd> 复制」或「按 <kbd>Cmd K</kbd> 呼出搜索」。

## 基础用法

<DemoBlock title="单键与组合键" description="传入字符串时逐字符拆分为多个键帽；组合键传数组。">

<p style="display:flex; align-items:center; gap:8px;">
  按 <EwKeycap keys="c" /> 复制邮箱地址
</p>
<p style="display:flex; align-items:center; gap:8px; margin-top:10px;">
  按 <EwKeycap :keys="['Cmd', 'K']" /> 呼出全局搜索
</p>

```vue
按 <EwKeycap keys="c" /> 复制邮箱地址
按 <EwKeycap :keys="['Cmd', 'K']" /> 呼出全局搜索
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| keys | 单键字符串（逐字符拆分）或组合键数组 | string / string[] | 必填 |

::: tip
键帽的立体感来自底部加粗边框（`border-bottom-width: 2px`）与轻投影，跟随明暗主题令牌自动适配。
:::
