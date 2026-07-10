import { validateContributionSubmission } from '@open-brands/schema'
import type { GitHubAdapter } from './github-adapter.js'
import { errorResponse, jsonResponse } from './http.js'

export interface ContributionState {
  submissionId: string
  userId: number
  userLogin: string
  state: 'draft' | 'validating' | 'valid' | 'needs-changes' | 'rejected' | 'pr-open' | 'failed'
  validationErrors: string[]
  validationWarnings: string[]
  branchName: string | null
  prNumber: number | null
  prUrl: string | null
  createdAt: string
  updatedAt: string
}

const submissions = new Map<string, ContributionState>()

export function handleContributionLogin(request: Request, requestId: string, githubRedirectUri: string): Response {
  const redirect = encodeURIComponent(githubRedirectUri)
  const clientId = process.env.GITHUB_CLIENT_ID ?? 'local-emulation'
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirect}&scope=read:user`
  return jsonResponse({ authUrl, mode: clientId === 'local-emulation' ? 'emulation' : 'production' })
}

export async function handleContributionCallback(
  request: Request,
  requestId: string,
  code: string,
  adapter: GitHubAdapter,
): Promise<Response> {
  try {
    const token = await adapter.getUserAccessToken(code)
    const user = await adapter.getUser(token)
    return jsonResponse({ user: { id: user.id, login: user.login }, authenticated: true })
  } catch (e) {
    return errorResponse('AUTH_FAILED', e instanceof Error ? e.message : 'Authentication failed', 401, requestId)
  }
}

export function handleContributionValidate(
  request: Request,
  requestId: string,
  body: unknown,
): Response {
  const result = validateContributionSubmission(body, { strictBot: true })
  const errors = result.diagnostics.filter((d) => d.severity === 'error')
  const warnings = result.diagnostics.filter((d) => d.severity === 'warning')

  if (errors.length > 0) {
    return jsonResponse({
      valid: false,
      requestId,
      errors: errors.map((e) => ({ code: e.code, message: e.message, fieldPath: e.fieldPath })),
      warnings: warnings.map((w) => ({ code: w.code, message: w.message })),
    }, { status: 422 })
  }

  return jsonResponse({
    valid: true,
    requestId,
    errors: [],
    warnings: warnings.map((w) => ({ code: w.code, message: w.message })),
  })
}

export async function handleContributionSubmit(
  request: Request,
  requestId: string,
  body: {
    userId: number
    userLogin: string
    brandId: string
    manifest: unknown
    files?: Array<{ path: string; content: string }>
  },
  adapter: GitHubAdapter,
): Promise<Response> {
  const result = validateContributionSubmission(
    body.manifest,
    { strictBot: true },
  )

  if (!result.valid) {
    return errorResponse('VALIDATION_FAILED', 'Contribution validation failed', 422, requestId, {
      errors: result.diagnostics.filter((d) => d.severity === 'error'),
    })
  }

  const submissionId = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const branchName = `contrib/${body.userId}/${submissionId}`

  const files: Array<{ path: string; content: string }> = body.files ?? []
  files.push({
    path: `data/brands/${body.brandId}/brand.json`,
    content: JSON.stringify(body.manifest, null, 2) + '\n',
  })

  try {
    const { sha } = await adapter.createBranch('server-token', {
      branchName,
      baseRef: 'main',
      files,
      commitMessage: `contribution: ${body.brandId} by @${body.userLogin}`,
    })

    const pr = await adapter.createPullRequest('server-token', {
      branchName,
      baseRef: 'main',
      title: `Add brand: ${body.brandId}`,
      body: [
        `## Contribution by @${body.userLogin}`,
        '',
        `**Brand:** ${(body.manifest as { name?: string })?.name ?? body.brandId}`,
        `**Type:** new-brand`,
        `**Submission ID:** ${submissionId}`,
        '',
        '### Declarations',
        '- [x] Sources are public',
        '- [x] No confidential material',
        '- [x] No ownership claim',
        '',
        '_This PR was created through the Open Brands contribution workflow._',
      ].join('\n'),
      draft: true,
    })

    const state: ContributionState = {
      submissionId,
      userId: body.userId,
      userLogin: body.userLogin,
      state: 'pr-open',
      validationErrors: [],
      validationWarnings: result.diagnostics.filter((d) => d.severity === 'warning').map((d) => d.message),
      branchName,
      prNumber: pr.number,
      prUrl: pr.url,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    submissions.set(submissionId, state)

    return jsonResponse({ submissionId, prNumber: pr.number, prUrl: pr.url, branchName }, { status: 201 })
  } catch (e) {
    return errorResponse('PR_CREATION_FAILED', e instanceof Error ? e.message : 'Failed to create PR', 500, requestId)
  }
}

export function handleContributionStatus(request: Request, requestId: string, submissionId: string): Response {
  const state = submissions.get(submissionId)
  if (!state) return errorResponse('NOT_FOUND', `Submission '${submissionId}' not found`, 404, requestId)
  return jsonResponse(state)
}
