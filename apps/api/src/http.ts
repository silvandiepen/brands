export interface Env {
  ENVIRONMENT?: string
  PUBLIC_API_ORIGIN?: string
  PUBLIC_CDN_ORIGIN?: string
  PUBLIC_WEB_ORIGIN?: string
  GITHUB_REPOSITORY?: string
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Expose-Headers': 'ETag, RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, X-Dataset-Version',
}

export function corsHeaders(): Record<string, string> {
  return { ...CORS_HEADERS }
}

export function jsonResponse(
  data: unknown,
  opts: { status?: number; etag?: string; headers?: Record<string, string> } = {},
): Response {
  const { status = 200, etag, headers = {} } = opts
  const body = JSON.stringify(data, null, 2) + '\n'
  const h: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    ...corsHeaders(),
    ...headers,
  }
  if (etag) {
    h['ETag'] = etag
  }
  return new Response(body, { status, headers: h })
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  requestId: string,
  details?: unknown,
): Response {
  return jsonResponse(
    { error: { code, message, ...(details ? { details } : {}) }, requestId },
    { status },
  )
}

export function redirectResponse(url: string, status = 302): Response {
  return new Response(null, {
    status,
    headers: {
      Location: url,
      ...corsHeaders(),
    },
  })
}

export function makeEtag(data: unknown): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)!) | 0
  }
  return `"${Math.abs(hash).toString(36)}"`
}

export function checkNotModified(request: Request, etag: string): boolean {
  const ifNoneMatch = request.headers.get('If-None-Match')
  return ifNoneMatch === etag || ifNoneMatch === '*'
}

export function generateRequestId(): string {
  return Math.random().toString(36).slice(2, 12)
}
