export interface Env {
  ENVIRONMENT?: string
  PUBLIC_API_ORIGIN?: string
  PUBLIC_CDN_ORIGIN?: string
  PUBLIC_WEB_ORIGIN?: string
  GITHUB_REPOSITORY?: string
  GITHUB_APP_ID?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  GITHUB_APP_PRIVATE_KEY?: string
  SESSION_SECRET?: string
  TURNSTILE_SECRET?: string
  INTERNAL_RELEASE_TOKEN?: string
  PUBLIC_ASSETS?: R2Bucket
  QUARANTINE_ASSETS?: R2Bucket
  DB?: D1Database
  PACK_QUEUE?: Queue<QueueMessage>
  VALIDATION_QUEUE?: Queue<QueueMessage>
  QUOTA_COORDINATOR?: DurableObjectNamespace
}

export interface QueueMessage {
  type: 'pack' | 'validation'
  id: string
  data: Record<string, unknown>
}

export class QuotaCoordinator implements DurableObject {
  state: DurableObjectState

  constructor(state: DurableObjectState, _env: Env) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/check-quota') {
      const subject = url.searchParams.get('subject') ?? ''
      const action = url.searchParams.get('action') ?? ''
      const limit = parseInt(url.searchParams.get('limit') ?? '10', 10)

      const windowKey = `${subject}:${action}:${Math.floor(Date.now() / 60000)}`
      const current = (await this.state.storage?.get<number>(windowKey)) ?? 0

      if (current >= limit) {
        return Response.json({ allowed: false, current, limit })
      }

      await this.state.storage?.put(windowKey, current + 1)
      return Response.json({ allowed: true, current: current + 1, limit })
    }

    return new Response('Not found', { status: 404 })
  }

  async alarm(): Promise<void> {
  }
}
