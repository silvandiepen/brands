import { getBrightness } from '@sil/color'

export function isDark(hex: string): boolean {
  try {
    return getBrightness(hex) < 0.5
  } catch {
    return false
  }
}

export function inkOn(hex: string): string {
  return isDark(hex) ? '#ffffff' : '#000000'
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}
