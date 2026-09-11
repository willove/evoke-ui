# Audio 音频

`EvAudio` 以胶囊卡片承载音频：图标徽章 + 标题 + 播放控件，适合播客节目、产品语音介绍、
课程试听等场景。`src` 缺省时可用默认插槽承载自定义播放器。

## 基础用法

<DemoBlock title="播客单集" description="真实使用时传 src 即可；演示环境用插槽占位。">

<EvAudio title="Vol.12 聊聊远程协作的工具栈" style="max-width:560px;">
  <span style="font-size:12px; color:var(--ev-text-secondary);">播放控件占位（演示环境无音频源）</span>
</EvAudio>

```vue
<EvAudio src="/ep12.mp3" title="Vol.12 聊聊远程协作的工具栈" />
```

</DemoBlock>

## API

### Props

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| src | 音频地址（渲染原生 audio 控件） | string | — |
| title | 标题文案 | string | — |

### 插槽

| 插槽 | 说明 |
| --- | --- |
| title | 标题覆写 |
| default | 覆写播放控件区域（src 缺省时展示） |
