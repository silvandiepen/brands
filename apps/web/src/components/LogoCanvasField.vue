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
  currentX: number
  currentY: number
  currentSize: number
  hiddenUntil: number
}

type Burst = {
  x: number
  y: number
  color: string
  ink: string
  startedAt: number
  pieces: Array<{
    angle: number
    speed: number
    size: number
    spin: number
    rotation: number
    image: HTMLImageElement | null
  }>
}

const reducedMotion = ref(false)
let ctx: CanvasRenderingContext2D | null = null
let frame = 0
let width = 0
let height = 0
let dpr = 1
let scrollY = 0
let particles: Particle[] = []
let bursts: Burst[] = []
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
      currentX: -999,
      currentY: -999,
      currentSize: 0,
      hiddenUntil: 0,
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
  const x = (p.x * laneWidth) - 90 + sway
  const fall = p.y * rainHeight + time * p.speed + scrollY * p.depth * 0.18
  const y = (fall % rainHeight) - 130
  const size = p.size * (0.82 + p.depth * 0.26)
  const radius = Math.max(12, size * 0.18)
  const alpha = 0.28 + p.depth * 0.34
  p.currentX = x
  p.currentY = y
  p.currentSize = size

  if (time < p.hiddenUntil) return

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

function createBurst(p: Particle, x: number, y: number, time: number) {
  const seed = hash(`${p.id}-${Math.round(time)}`)
  bursts.push({
    x,
    y,
    color: p.color,
    ink: inkOn(p.color),
    startedAt: time,
    pieces: Array.from({ length: 18 }, (_, index) => ({
      angle: (Math.PI * 2 * index) / 18 + (unit(seed, index) - 0.5) * 0.55,
      speed: 80 + unit(seed, index + 20) * 180,
      size: 4 + unit(seed, index + 40) * 14,
      spin: (unit(seed, index + 60) - 0.5) * 5,
      rotation: unit(seed, index + 80) * Math.PI,
      image: index % 4 === 0 ? p.image : null,
    })),
  })
  p.hiddenUntil = time + 520
}

function drawBursts(time: number) {
  if (!ctx) return
  bursts = bursts.filter((burst) => time - burst.startedAt < 760)
  for (const burst of bursts) {
    const age = (time - burst.startedAt) / 1000
    const progress = Math.min(1, age / 0.76)
    const fade = 1 - progress

    for (const piece of burst.pieces) {
      const distance = piece.speed * age
      const gravity = 95 * age * age
      const x = burst.x + Math.cos(piece.angle) * distance
      const y = burst.y + Math.sin(piece.angle) * distance + gravity
      const size = piece.size * (1 - progress * 0.28)

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(piece.rotation + piece.spin * age)
      ctx.globalAlpha = Math.max(0, fade)
      if (piece.image?.complete && piece.image.naturalWidth > 0) {
        ctx.drawImage(piece.image, -size, -size, size * 2, size * 2)
      } else {
        ctx.fillStyle = piece.size > 10 ? burst.color : burst.ink
        roundedRect(-size / 2, -size / 2, size, size, Math.max(2, size * 0.25))
        ctx.fill()
      }
      ctx.restore()
    }
  }
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
  drawBursts(animationTime)
  frame = requestAnimationFrame(tick)
}

function onScroll() {
  scrollY = window.scrollY
}

function onClick(event: MouseEvent) {
  if (reducedMotion.value) return
  const rect = canvas.value?.getBoundingClientRect()
  if (!rect) return

  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const hit = [...particles]
    .reverse()
    .find((particle) => {
      const half = particle.currentSize / 2
      return x >= particle.currentX - half
        && x <= particle.currentX + half
        && y >= particle.currentY - half
        && y <= particle.currentY + half
    })

  if (hit) createBurst(hit, x, y, performance.now())
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
    @click="onClick"
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
