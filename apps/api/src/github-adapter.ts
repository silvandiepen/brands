export interface GitHubUser {
  id: number
  login: string
  created_at: string
}

export interface CreateBranchOptions {
  branchName: string
  baseRef: string
  files: Array<{ path: string; content: string }>
  commitMessage: string
}

export interface CreatePROptions {
  branchName: string
  baseRef: string
  title: string
  body: string
  draft: boolean
}

export interface PullRequestResult {
  number: number
  url: string
  headSha: string
}

export interface GitHubAdapter {
  getUserAccessToken(code: string): Promise<string>
  getUser(token: string): Promise<GitHubUser>
  createBranch(token: string, opts: CreateBranchOptions): Promise<{ sha: string }>
  createPullRequest(token: string, opts: CreatePROptions): Promise<PullRequestResult>
  updateBranch(token: string, branchName: string, files: Array<{ path: string; content: string }>, commitMessage: string): Promise<{ sha: string }>
}

export interface GitHubConfig {
  appId: string
  clientId: string
  clientSecret: string
  privateKey: string
  repository: string
  redirectUri: string
}

export function createGitHubAdapter(config: GitHubConfig | null): GitHubAdapter {
  if (!config) {
    return createLocalEmulationAdapter()
  }
  return createProductionAdapter(config)
}

function createLocalEmulationAdapter(): GitHubAdapter {
  const branches = new Map<string, Array<{ path: string; content: string }>>()
  const prs: PullRequestResult[] = []
  let prCounter = 1

  return {
    async getUserAccessToken(_code: string): Promise<string> {
      return 'local-emulation-token'
    },

    async getUser(_token: string): Promise<GitHubUser> {
      return {
        id: 1001,
        login: 'local-contributor',
        created_at: '2024-01-01T00:00:00Z',
      }
    },

    async createBranch(_token: string, opts: CreateBranchOptions): Promise<{ sha: string }> {
      branches.set(opts.branchName, opts.files)
      return { sha: `local-sha-${opts.branchName}` }
    },

    async createPullRequest(_token: string, opts: CreatePROptions): Promise<PullRequestResult> {
      const pr: PullRequestResult = {
        number: prCounter++,
        url: `https://github.com/silvandiepen/brands/pull/${prCounter}`,
        headSha: `local-sha-${opts.branchName}`,
      }
      prs.push(pr)
      return pr
    },

    async updateBranch(_token: string, branchName: string, files: Array<{ path: string; content: string }>, _message: string): Promise<{ sha: string }> {
      const existing = branches.get(branchName) ?? []
      branches.set(branchName, [...existing, ...files])
      return { sha: `local-sha-${branchName}-updated` }
    },
  }
}

function createProductionAdapter(config: GitHubConfig): GitHubAdapter {
  const apiBase = 'https://api.github.com'

  return {
    async getUserAccessToken(code: string): Promise<string> {
      const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.redirectUri,
        }),
      })
      const data = await res.json() as { access_token?: string; error?: string }
      if (!data.access_token) throw new Error(`GitHub OAuth error: ${data.error ?? 'unknown'}`)
      return data.access_token
    },

    async getUser(token: string): Promise<GitHubUser> {
      const res = await fetch(`${apiBase}/user`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      })
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
      return res.json() as Promise<GitHubUser>
    },

    async createBranch(token: string, opts: CreateBranchOptions): Promise<{ sha: string }> {
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      }

      const refRes = await fetch(`${apiBase}/repos/${config.repository}/git/refs/heads/${opts.baseRef}`, { headers })
      if (!refRes.ok) throw new Error(`Cannot get base ref: ${refRes.status}`)
      const ref = await refRes.json() as { object: { sha: string } }

      const createRes = await fetch(`${apiBase}/repos/${config.repository}/git/refs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ref: `refs/heads/${opts.branchName}`, sha: ref.object.sha }),
      })
      if (!createRes.ok) throw new Error(`Cannot create branch: ${createRes.status}`)

      const treeEntries = opts.files.map((f) => ({
        path: f.path,
        mode: '100644',
        type: 'blob',
        content: f.content,
      }))

      const treeRes = await fetch(`${apiBase}/repos/${config.repository}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ base_tree: ref.object.sha, tree: treeEntries }),
      })
      if (!treeRes.ok) throw new Error(`Cannot create tree: ${treeRes.status}`)
      const tree = await treeRes.json() as { sha: string }

      const commitRes = await fetch(`${apiBase}/repos/${config.repository}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: opts.commitMessage,
          tree: tree.sha,
          parents: [ref.object.sha],
        }),
      })
      if (!commitRes.ok) throw new Error(`Cannot create commit: ${commitRes.status}`)
      const commit = await commitRes.json() as { sha: string }

      await fetch(`${apiBase}/repos/${config.repository}/git/refs/heads/${opts.branchName}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ sha: commit.sha }),
      })

      return { sha: commit.sha }
    },

    async createPullRequest(token: string, opts: CreatePROptions): Promise<PullRequestResult> {
      const res = await fetch(`${apiBase}/repos/${config.repository}/pulls`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: opts.title,
          body: opts.body,
          head: opts.branchName,
          base: opts.baseRef,
          draft: opts.draft,
        }),
      })
      if (!res.ok) throw new Error(`Cannot create PR: ${res.status}`)
      const pr = await res.json() as { number: number; html_url: string; head: { sha: string } }
      return { number: pr.number, url: pr.html_url, headSha: pr.head.sha }
    },

    async updateBranch(token: string, branchName: string, files: Array<{ path: string; content: string }>, message: string): Promise<{ sha: string }> {
      return this.createBranch(token, {
        branchName,
        baseRef: 'main',
        files,
        commitMessage: message,
      })
    },
  }
}
