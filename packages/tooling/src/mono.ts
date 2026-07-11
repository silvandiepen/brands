export function toMonochrome(source: string): string {
  let svg = source

  svg = svg.replace(/<linearGradient\b[^>]*>[\s\S]*?<\/linearGradient>/gi, '')
  svg = svg.replace(/<radialGradient\b[^>]*>[\s\S]*?<\/radialGradient>/gi, '')
  svg = svg.replace(/<pattern\b[^>]*>[\s\S]*?<\/pattern>/gi, '')

  svg = svg.replace(/fill\s*=\s*"(?:url\([^)]*\)|#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]*\)|red|blue|green|yellow|orange|purple|pink|brown|gray|grey|black|white|cyan|magenta|navy|teal|olive|maroon|lime|aqua|silver|maroon)"/gi, 'fill="currentColor"')
  svg = svg.replace(/stroke\s*=\s*"(?:#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]*\)|red|blue|green|yellow|orange|purple|pink|brown|gray|grey|black|white|cyan|magenta|navy|teal|olive|maroon|lime|aqua|silver)"/gi, 'stroke="currentColor"')

  svg = svg.replace(/\bstop-color\s*=\s*"[^"]*"/gi, '')
  svg = svg.replace(/<stop\b[^>]*\/>/gi, '')

  svg = svg.replace(/\s+id\s*=\s*"[^"]*"/gi, '')
  svg = svg.replace(/\s+clip-path\s*=\s*"url\([^)]*\)"/gi, '')
  svg = svg.replace(/\s+mask\s*=\s*"url\([^)]*\)"/gi, '')

  svg = svg.replace(/\n{3,}/g, '\n\n').trim()

  return svg + '\n'
}
