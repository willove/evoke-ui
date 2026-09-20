/**
 * Options 校验 — 手写 JSON-Schema 子集（与 evoke-charts 同一套实现思路）
 *
 * 校验只告警不阻断：dev 模式下组件把警告打印到控制台，生产渲染永不受影响。
 * 好处是图型能力可以先行，契约滞后一步不会炸掉用户的页面。
 */
import { CHART3D_TYPES } from './types.js'
import { CHART3D_PALETTE_IDS } from './palette.js'

const seriesSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    data: { type: 'array' },
    color: { type: 'string' },
  },
}

const pieItemSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    value: { type: 'number' },
    color: { type: 'string' },
  },
}

const axisSchema = {
  type: 'object',
  properties: {
    show: { type: 'boolean' },
    labels: { type: 'boolean' },
    grid: { type: 'boolean' },
    line: { type: 'boolean' },
    title: { type: 'boolean' },
    name: { type: 'string' },
    type: { type: 'string', enum: ['category', 'value'] },
    min: { type: 'number' },
    max: { type: 'number' },
    ticks: { type: 'number' },
    maxTicks: { type: 'number' },
    padding: { type: 'number' },
    headroom: { type: 'number' },
    formatter: { type: 'function' },
  },
}

export const chart3dOptionsSchema = {
  type: 'object',
  required: ['type'],
  properties: {
    type: { type: 'string', enum: CHART3D_TYPES },
    labels: { type: 'array' },
    series: { type: 'array', items: seriesSchema },
    pieData: { type: 'array', items: pieItemSchema },
    scatterData: { type: 'array' },
    surfaceData: {
      type: 'object',
      properties: {
        x: { type: 'array' },
        y: { type: 'array' },
        z: { type: 'array', items: { type: 'array' } },
      },
    },
    matrix: { type: 'array', items: { type: 'array' } },
    palette: { type: 'string', enum: CHART3D_PALETTE_IDS },
    theme: { type: 'object' },
    colors: { type: 'array' },
    camera: {
      type: 'object',
      properties: {
        yaw: { type: 'number' },
        pitch: { type: 'number' },
        distance: { type: 'number' },
        fov: { type: 'number' },
        target: { type: 'array' },
        minPitch: { type: 'number' },
        maxPitch: { type: 'number' },
        minDistance: { type: 'number' },
        maxDistance: { type: 'number' },
        autoRotate: { type: 'boolean' },
        autoRotateSpeed: { type: 'number' },
        damping: { type: 'number' },
      },
    },
    xAxis: axisSchema,
    yAxis: axisSchema,
    zAxis: axisSchema,
    grid: {
      type: 'object',
      properties: { show: { type: 'boolean' } },
    },
    box: {
      type: 'object',
      properties: {
        show: { type: 'boolean' },
        walls: { type: ['string', 'boolean'], enum: ['all', 'back', 'side', 'none', true, false] },
        frame: { type: 'boolean' },
      },
    },
    lighting: {
      type: 'object',
      properties: {
        ambient: { type: 'number' },
        intensity: { type: 'number' },
        follow: { type: 'boolean' },
        direction: { type: 'array' },
        flat: { type: 'boolean' },
      },
    },
    bar: {
      type: 'object',
      properties: {
        width: { type: 'number' },
        depth: { type: 'number' },
        shadow: { type: 'boolean' },
      },
    },
    line: {
      type: 'object',
      properties: {
        area: { type: 'boolean' },
        dropLines: { type: 'boolean' },
        width: { type: 'number' },
        points: { type: 'boolean' },
        pointRadius: { type: 'number' },
      },
    },
    scatter: {
      type: 'object',
      properties: {
        size: { type: 'number' },
        dropLines: { type: 'boolean' },
        colorScale: { type: ['boolean', 'string'] },
        depthScale: { type: 'boolean' },
      },
    },
    surface: {
      type: 'object',
      properties: {
        wireframe: { type: 'boolean' },
        opacity: { type: 'number' },
        ramp: { type: 'string' },
      },
    },
    pie: {
      type: 'object',
      properties: {
        radius: { type: 'number' },
        innerRadius: { type: 'number' },
        thickness: { type: 'number' },
        startAngle: { type: 'number' },
        padAngle: { type: 'number' },
        shadow: { type: 'boolean' },
      },
    },
    legend: {
      type: 'object',
      properties: {
        show: { type: 'boolean' },
        position: { type: 'string', enum: ['top', 'bottom'] },
        align: { type: 'string', enum: ['start', 'center', 'end'] },
        formatter: { type: 'function' },
        itemGap: { type: 'number' },
      },
    },
    tooltip: {
      type: 'object',
      properties: {
        show: { type: 'boolean' },
        trigger: { type: 'string', enum: ['hover', 'click'] },
        formatter: { type: 'function' },
        valueFormatter: { type: 'function' },
      },
    },
    label: {
      type: 'object',
      properties: { show: { type: 'boolean' } },
    },
    title: {
      type: ['string', 'object'],
      properties: {
        text: { type: 'string' },
        subtitle: { type: 'string' },
        show: { type: 'boolean' },
        left: { type: 'number' },
      },
    },
    animation: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        duration: { type: 'number' },
        easing: {
          type: 'string',
          enum: ['linear', 'easeIn', 'easeOut', 'easeInOut', 'easeOutBack', 'easeOutExpo'],
        },
      },
    },
    ariaLabel: { type: 'string' },
    lang: { type: 'string', enum: ['zh', 'en'] },
    i18n: { type: 'object' },
  },
}

const TYPE_CHECKS = {
  object: (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
  array: (v) => Array.isArray(v),
  string: (v) => typeof v === 'string',
  number: (v) => typeof v === 'number' && Number.isFinite(v),
  boolean: (v) => typeof v === 'boolean',
  function: (v) => typeof v === 'function',
}

function typeMatches(node, value) {
  const types = Array.isArray(node.type) ? node.type : [node.type]
  return types.some((t) => {
    const check = TYPE_CHECKS[t]
    return check ? check(value) : true
  })
}

function typeName(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function validateNode(node, value, path, warnings) {
  if (!node || typeof node !== 'object') return
  if (node.type && !typeMatches(node, value)) {
    warnings.push({
      path,
      message: Array.isArray(node.type)
        ? `类型不匹配（应为 ${node.type.join(' / ')} 之一）`
        : `应为 ${node.type}，实际为 ${typeName(value)}`,
    })
    return
  }
  if (node.enum && !node.enum.includes(value)) {
    warnings.push({ path, message: `应为 ${node.enum.map((e) => String(e)).join(' / ')} 之一，实际为 ${String(value)}` })
    return
  }
  if (node.type === 'object' && TYPE_CHECKS.object(value)) {
    for (const key of node.required || []) {
      if (!(key in value)) warnings.push({ path: `${path}.${key}`, message: '缺少必填字段' })
    }
    if (node.properties) {
      for (const [key, sub] of Object.entries(node.properties)) {
        if (key in value && value[key] !== undefined && value[key] !== null) {
          validateNode(sub, value[key], `${path}.${key}`, warnings)
        }
      }
    }
  }
  if (node.type === 'array' && Array.isArray(value)) {
    if (node.items) {
      value.forEach((item, i) => validateNode(node.items, item, `${path}[${i}]`, warnings))
    }
  }
}

/**
 * 校验 options
 * @returns {{ok: boolean, warnings: Array<{path:string, message:string}>}}
 */
export function validateOptions3d(options) {
  const warnings = []
  if (options === null || typeof options !== 'object' || Array.isArray(options)) {
    return { ok: false, warnings: [{ path: 'options', message: '应为对象' }] }
  }
  validateNode(chart3dOptionsSchema, options, 'options', warnings)
  return { ok: warnings.length === 0, warnings }
}
