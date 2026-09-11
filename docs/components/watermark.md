# Watermark 水印

内容保护：在容器上平铺文字 / 图片水印，默认覆盖整个父容器区域，防止敏感页面截图外泄。

## 基础用法

<DemoBlock>
  <eb-watermark content="Evoke Business UI 内部资料" :gap="[80, 80]" :alpha="0.6">
    <div style="height: 200px; border: 1px dashed var(--eb-border-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--eb-text-color-secondary);">
      受水印保护的报表区域
    </div>
  </eb-watermark>
</DemoBlock>

## 多行文字水印

<DemoBlock>
  <eb-watermark :content="['王敏', '2026-09-07']" :gap="[100, 80]">
    <div style="height: 160px; border: 1px dashed var(--eb-border-color); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--eb-text-color-secondary);">
      合同预览区域
    </div>
  </eb-watermark>
</DemoBlock>

## Watermark API

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| content | String / Array | — | 水印文字（数组为多行） |
| image | String | — | 图片水印地址（优先于文字） |
| width / height | Number | `120 / 64` | 单个水印尺寸 |
| rotate | Number | `-22` | 旋转角度 |
| gap | Array | `[100, 100]` | 水印间距 `[x, y]` |
| offset | Array | `[0, 0]` | 整体偏移 |
| alpha | Number | `1` | 透明度 |
| z-index | Number | `9` | 层级 |
| font | Object | — | 字体设置 `{ fontSize, color, fontWeight, fontFamily }` |
