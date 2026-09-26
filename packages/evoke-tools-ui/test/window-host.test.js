import { describe, it, expect } from 'vitest'
import { HOSTS, windowControlPlacement, detectPlatform, WINDOW_CONTROLS } from '../src/runtime/window/host'

describe('宿主与平台探测（M3：双宿主标题栏）', () => {
  it('窗口控制位布局矩阵', () => {
    expect(windowControlPlacement('web', 'mac')).toBe('none')
    expect(windowControlPlacement('web', 'windows')).toBe('none')
    expect(windowControlPlacement('desktop', 'mac')).toBe('left')
    expect(windowControlPlacement('desktop', 'windows')).toBe('right')
    expect(windowControlPlacement('desktop', 'linux')).toBe('right')
    expect(windowControlPlacement('desktop', 'unknown')).toBe('right') // 保险值
  })

  it('UA 探测桌面壳（Tauri/Electron）', () => {
    expect(detectPlatform({ userAgent: 'Mozilla Tauri/1.0 Mac' }, null).host).toBe('desktop')
    expect(detectPlatform({ userAgent: 'Mozilla Electron/30 Win' }, null).host).toBe('desktop')
    expect(detectPlatform({ userAgent: 'Mozilla Chrome Mac' }, null)).toEqual({ host: 'web', platform: 'mac' })
    expect(detectPlatform({ userAgent: 'Mozilla Chrome Win' }, null)).toEqual({ host: 'web', platform: 'windows' })
  })

  it('userAgentData（Win 新 UA 策略下 platform 为空，必须看 UAHP）', () => {
    expect(detectPlatform({ userAgent: 'x', userAgentData: { platform: 'macOS' } }, null).platform).toBe('mac')
    expect(detectPlatform({ userAgent: 'x', userAgentData: { platform: 'Windows' } }, null).platform).toBe('windows')
    expect(detectPlatform({ userAgent: 'x', userAgentData: { platform: 'Linux' } }, null).platform).toBe('linux')
  })

  it('data-host 显示覆盖优先（宿主自证 + 测试注入）', () => {
    expect(detectPlatform({ userAgent: 'Chrome Win' }, 'desktop')).toEqual({ host: 'desktop', platform: 'windows' })
    expect(detectPlatform({ userAgent: 'Tauri Mac' }, 'web')).toEqual({ host: 'web', platform: 'mac' })
  })

  it('控制位顺序：mac traffic lights 左序 close-first', () => {
    expect(WINDOW_CONTROLS.mac).toEqual(['close', 'minimize', 'maximize'])
    expect(WINDOW_CONTROLS.windows).toEqual(['minimize', 'maximize', 'close'])
    expect(HOSTS).toEqual(['web', 'desktop'])
  })
})
