export type DiagnosticSeverity = 'error' | 'warning'

export interface Diagnostic {
  severity: DiagnosticSeverity
  code: string
  message: string
  filePath?: string | undefined
  fieldPath?: string | undefined
  brandId?: string | undefined
}

export class DiagnosticCollector {
  private diagnostics: Diagnostic[] = []

  static from(existing: Diagnostic[]): DiagnosticCollector {
    const dc = new DiagnosticCollector()
    dc.diagnostics = [...existing]
    return dc
  }

  add(diagnostic: Diagnostic): void {
    this.diagnostics.push(diagnostic)
  }

  error(code: string, message: string, opts: Partial<Omit<Diagnostic, 'severity' | 'code' | 'message'>> = {}): void {
    this.add({ severity: 'error', code, message, ...opts })
  }

  warning(code: string, message: string, opts: Partial<Omit<Diagnostic, 'severity' | 'code' | 'message'>> = {}): void {
    this.add({ severity: 'warning', code, message, ...opts })
  }

  get all(): Diagnostic[] {
    return [...this.diagnostics]
  }

  get errors(): Diagnostic[] {
    return this.diagnostics.filter((d) => d.severity === 'error')
  }

  get warnings(): Diagnostic[] {
    return this.diagnostics.filter((d) => d.severity === 'warning')
  }

  get hasErrors(): boolean {
    return this.diagnostics.some((d) => d.severity === 'error')
  }

  get count(): number {
    return this.diagnostics.length
  }

  clear(): void {
    this.diagnostics = []
  }

  merge(other: DiagnosticCollector): void {
    this.diagnostics.push(...other.diagnostics)
  }

  toString(): string {
    return this.diagnostics
      .map((d) => {
        const parts = [d.severity.toUpperCase(), d.code]
        if (d.filePath) parts.push(d.filePath)
        if (d.fieldPath) parts.push(d.fieldPath)
        parts.push(d.message)
        return parts.join(' | ')
      })
      .join('\n')
  }
}

export interface ValidationResult {
  valid: boolean
  diagnostics: Diagnostic[]
}
