<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useBemm } from 'bemm'
import { inkOn } from '../utils'

type LogoItem = {
  id: string
  name: string
  color: string
  logoUrl: string
}

const props = defineProps<{
  items: LogoItem[]
}>()

const bemm = useBemm('logo-canvas-field', { return: 'string', includeBaseClass: true })
const canvas = ref<HTMLCanvasElement | null>(null)

type Particle = LogoItem & {
  x: number
  y: number
  size: number
  depth: number
  speed: number
  drift: number
  phase: number
  rotation: number
  spin: number
  image: HTMLImageElement | null
}

const reducedMotion = ref(false)
const pointer = { x: 0, y: 0, active: false }
let ctx: CanvasRenderingContext2D | null = null
let frame = 0
let width = 0
let height = 0
let dpr = 1
let scrollY = 0
let particles: Particle[] = []
let resizeObserver: ResizeObserver | null = null

const seedItems = computed(() => props.items.slice(0, 38))

function hash(input: string) {
  let value = 0
  for (let i = 0; i < input.length; i++) value = (value * 31 + input.charCodeAt(i)) >>> 0
  return value
}

function unit(seed: number, offset: number) {
  const x = Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function buildParticles() {
  particles = seedItems.value.map((item) => {
    const seed = hash(item.id)
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.src = item.logoUrl

    return {
      ...item,
      x: unit(seed, 1),
      y: unit(seed, 2),
      size: 42 + unit(seed, 3) * 86,
      depth: 0.45 + unit(seed, 4) * 0.9,
      speed: 0.018 + unit(seed, 5) * 0.038,
      drift: (unit(seed, 6) - 0.5) * 34,
      phase: unit(seed, 7) * Math.PI * 2,
      rotation: (unit(seed, 8) - 0.5) * 0.08,
      spin: (unit(seed, 9) - 0.5) * 0.00006,
      image,
    }
  }).sort((a, b) => a.depth - b.depth)
}

function resize() {
  const el = canvas.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = Math.max(1, rect.width)
  height = Math.max(1, rect.height)
  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)
  ctx = el.getContext('2d')
  ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function drawLogo(p: Particle, time: number) {
  if (!ctx) return
  const laneWidth = width + 180
  const rainHeight = height + 260
  const sway = Math.sin(time * 0.0007 + p.phase) * p.drift
  const parallaxX = pointer.active ? (pointer.x - 0.5) * 24 * p.depth : 0
  const parallaxY = pointer.active ? (pointer.y - 0.5) * 16 * p.depth : 0
  const x = (p.x * laneWidth) - 90 + sway + parallaxX
  const fall = p.y * rainHeight + time * p.speed + scrollY * p.depth * 0.18 + parallaxY
  const y = (fall % rainHeight) - 130
  const size = p.size * (0.82 + p.depth * 0.26)
  const radius = Math.max(12, size * 0.18)
  const alpha = 0.28 + p.depth * 0.34

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(p.rotation + Math.sin(time * 0.00045 + p.phase) * 0.035 + time * p.spin)
  ctx.globalAlpha = alpha
  ctx.fillStyle = p.color
  roundedRect(-size / 2, -size / 2, size, size, radius)
  ctx.fill()

  if (p.image?.complete && p.image.naturalWidth > 0) {
    const logoSize = size * 0.48
    ctx.globalAlpha = Math.min(0.94, alpha + 0.28)
    ctx.drawImage(p.image, -logoSize / 2, -logoSize / 2, logoSize, logoSize)
  } else {
    ctx.globalAlpha = Math.min(0.9, alpha + 0.2)
    ctx.fillStyle = inkOn(p.color)
    ctx.font = `700 ${Math.max(16, size * 0.22)}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(p.name.slice(0, 1), 0, 1)
  }
  ctx.restore()
}

function roundedRect(x: number, y: number, w: number, h: number, r: number) {
  if (!ctx) return
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function tick(time = 0) {
  if (!ctx) {
    frame = requestAnimationFrame(tick)
    return
  }
  ctx.clearRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'

  const gradient = ctx.createRadialGradient(width * 0.5, height * 0.48, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.58)
  gradient.addColorStop(0, 'rgba(70, 128, 255, 0.12)')
  gradient.addColorStop(0.55, 'rgba(70, 128, 255, 0.04)')
  gradient.addColorStop(1, 'rgba(70, 128, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  const animationTime = reducedMotion.value ? 0 : time
  for (const particle of particles) drawLogo(particle, animationTime)
  frame = requestAnimationFrame(tick)
}

function onScroll() {
  scrollY = window.scrollY
}

function onPointerMove(event: PointerEvent) {
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return
  pointer.active = true
  pointer.x = (event.clientX - rect.left) / rect.width
  pointer.y = (event.clientY - rect.top) / rect.height
}

function onPointerLeave() {
  pointer.active = false
}

watch(seedItems, buildParticles, { deep: true })

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  buildParticles()
  resize()
  resizeObserver = new ResizeObserver(resize)
  if (canvas.value) resizeObserver.observe(canvas.value)
  window.addEventListener('scroll', onScroll, { passive: true })
  frame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <canvas
    ref="canvas"
    :class="bemm()"
    aria-hidden="true"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
  />
</template>

<style lang="scss">
.logo-canvas-field {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}
</style>
