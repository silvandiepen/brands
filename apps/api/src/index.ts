import {
  handleMeta,
  handleBrands,
  handleBrandDetail,
  handleBrandColors,
  handleBrandAssets,
  handleBrandImage,
  handleResolve,
  handleSearch,
  handleCategories,
  handleCollections,
  handlePackCreate,
  handlePackStatus,
  handlePackDownload,
  handleBrandSearch,
} from './routes.js'
import { handleOpenApi } from './openapi.js'
import { handleLogoCdn } from './logo-cdn.js'
import { errorResponse, generateRequestId, corsHeaders } from './http.js'
import { QuotaCoordinator, type Env, type QueueMessage } from './env.js'

export { QuotaCoordinator }
import { createGitHubAdapter, type GitHubAdapter } from './github-adapter.js'
import {
  handleContributionLogin,
  handleContributionCallback,
  handleContributionValidate,
  handleContributionSubmit,
  handleContributionStatus,
} from './contributions.js'

let githubAdapter: GitHubAdapter | null = null

function getAdapter(_env: Env): GitHubAdapter {
  if (!githubAdapter) {
    githubAdapter = createGitHubAdapter(null)
  }
  return githubAdapter
}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url)
    const requestId = generateRequestId()
    const method = request.method
    const path = url.pathname

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    try {
      const response = await route(method, path, request, requestId, url, _env)
      const headers = new Headers(response.headers)
      headers.set('X-Request-Id', requestId)
      return new Response(response.body, { status: response.status, headers })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error'
      return errorResponse('INTERNAL_ERROR', message, 500, requestId)
    }
  },

  async queue(batch: MessageBatch<QueueMessage>, _env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        message.ack()
      } catch {
        message.retry()
      }
    }
  },
}

async function route(method: string, path: string, request: Request, requestId: string, url: URL, _env: Env): Promise<Response> {
  if (path === '/' && method === 'GET') {
    return new Response(
      JSON.stringify({ name: 'Open Brands API', version: '1.0.0', docs: '/v1/meta', openapi: '/openapi.json' }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  }
  if (path === '/openapi.json' && method === 'GET') return handleOpenApi()

  // Logo CDN API: /logo/:identifier.svg, /logo/domain/:domain.svg
  if (path.startsWith('/logo/') && method === 'GET') {
    return await handleLogoCdn(path.slice(6), url, _env)
  }

  if (path.startsWith('/api/contributions')) {
    return handleContributionRoutes(method, path, request, requestId, url, _env)
  }

  if (!path.startsWith('/v1/')) {
    return errorResponse('NOT_FOUND', `Route ${method} ${path} not found`, 404, requestId)
  }

  const rest = path.slice(4)
  const parts = rest.split('/').filter(Boolean)

  if (parts.length === 1) {
    const r = parts[0]!
    if (r === 'meta' && method === 'GET') return handleMeta(request, requestId)
    if (r === 'search' && method === 'GET') return handleSearch(request, requestId, url)
    if (r === 'search' && method === 'GET') return handleSearch(request, requestId, url)
    if (r === 'brands' && method === 'GET') return handleBrands(request, requestId, url)
    if (r === 'categories' && method === 'GET') return handleCategories(request, requestId)
    if (r === 'collections' && method === 'GET') return handleCollections(request, requestId)
    if (r === 'packs' && method === 'POST') return handlePackCreate(request, requestId)
    if (r === 'brand-search' && method === 'GET') return handleBrandSearch(request, requestId, url)
  }

  if (parts.length === 2) {
    const [resource, id] = parts
    if (resource === 'brands' && method === 'GET') return handleBrandDetail(request, requestId, id!)
    if (resource === 'resolve' && method === 'GET') return handleResolve(request, requestId, id!)
    if (resource === 'packs' && method === 'GET') return handlePackStatus(request, requestId, id!)
  }

  if (parts.length === 3 && parts[0] === 'packs' && parts[2] === 'download') {
    const packId = parts[1]!
    if (method === 'GET') return handlePackDownload(request, requestId, packId)
  }

  if (parts.length === 3 && parts[0] === 'brands') {
    const brandId = parts[1]!
    const sub = parts[2]!
    if (sub === 'colors' && method === 'GET') return handleBrandColors(request, requestId, brandId)
    if (sub === 'assets' && method === 'GET') return handleBrandAssets(request, requestId, brandId, url)
    if (sub === 'image' && method === 'GET') return handleBrandImage(request, requestId, brandId, url)
  }

  return errorResponse('NOT_FOUND', `Route ${method} ${path} not found`, 404, requestId)
}

async function handleContributionRoutes(method: string, path: string, request: Request, requestId: string, url: URL, env: Env): Promise<Response> {
  const adapter = getAdapter(env)
  const redirectUri = `${url.origin}/api/contributions/callback`

  if (path === '/api/contributions/login' && method === 'GET') {
    return handleContributionLogin(request, requestId, redirectUri)
  }

  if (path === '/api/contributions/callback' && method === 'GET') {
    const code = url.searchParams.get('code') ?? ''
    return handleContributionCallback(request, requestId, code, adapter)
  }

  if (path === '/api/contributions/validate' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    return handleContributionValidate(request, requestId, body)
  }

  if (path === '/api/contributions/submit' && method === 'POST') {
    const body = await request.json().catch(() => ({}))
    return handleContributionSubmit(request, requestId, body as Parameters<typeof handleContributionSubmit>[2], adapter)
  }

  if (path.startsWith('/api/contributions/') && method === 'GET') {
    const submissionId = path.split('/').pop()!
    return handleContributionStatus(request, requestId, submissionId)
  }

  return errorResponse('NOT_FOUND', `Route ${method} ${path} not found`, 404, requestId)
}
