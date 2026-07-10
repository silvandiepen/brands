PRAGMA foreign_keys = ON;

CREATE TABLE users (
  github_user_id INTEGER PRIMARY KEY,
  github_login TEXT NOT NULL,
  trust_tier TEXT NOT NULL DEFAULT 'new' CHECK (trust_tier IN ('new', 'trusted', 'maintainer')),
  moderation_state TEXT NOT NULL DEFAULT 'active' CHECK (moderation_state IN ('active', 'cooldown', 'suspended')),
  cooldown_until TEXT,
  first_seen_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY,
  github_user_id INTEGER NOT NULL REFERENCES users(github_user_id) ON DELETE CASCADE,
  csrf_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  rotated_at TEXT
);

CREATE INDEX sessions_user_idx ON sessions(github_user_id);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at);

CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  github_user_id INTEGER NOT NULL REFERENCES users(github_user_id),
  type TEXT NOT NULL CHECK (type IN ('new-brand', 'edit-brand', 'add-asset', 'correct-colors', 'add-historical')),
  brand_id TEXT NOT NULL,
  state TEXT NOT NULL CHECK (
    state IN (
      'draft',
      'uploaded',
      'validating',
      'valid',
      'needs-changes',
      'rejected',
      'pr-creating',
      'pr-open',
      'changes-requested',
      'merged',
      'closed',
      'withdrawn',
      'expired'
    )
  ),
  base_dataset_version TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  current_validation_sha256 TEXT,
  branch_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE INDEX submissions_user_state_idx ON submissions(github_user_id, state);
CREATE INDEX submissions_brand_state_idx ON submissions(brand_id, state);
CREATE INDEX submissions_expiry_idx ON submissions(expires_at);

CREATE TABLE submission_files (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  upload_id TEXT NOT NULL UNIQUE,
  r2_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 524288),
  sha256 TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'uploaded' CHECK (state IN ('uploaded', 'validated', 'rejected', 'deleted')),
  created_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX submission_files_submission_idx ON submission_files(submission_id);
CREATE INDEX submission_files_sha_idx ON submission_files(sha256);

CREATE TABLE validations (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  tool_version TEXT NOT NULL,
  input_sha256 TEXT NOT NULL,
  result_sha256 TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('running', 'valid', 'invalid', 'failed')),
  errors_json TEXT NOT NULL DEFAULT '[]',
  warnings_json TEXT NOT NULL DEFAULT '[]',
  normalized_manifest_json TEXT,
  normalized_files_json TEXT,
  preview_r2_prefix TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX validations_submission_created_idx ON validations(submission_id, created_at DESC);
CREATE UNIQUE INDEX validations_result_unique_idx ON validations(submission_id, result_sha256);

CREATE TABLE pull_requests (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE REFERENCES submissions(id) ON DELETE CASCADE,
  repository TEXT NOT NULL DEFAULT 'silvandiepen/brands',
  branch_name TEXT NOT NULL UNIQUE,
  pr_number INTEGER NOT NULL UNIQUE,
  head_sha TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('draft', 'open', 'changes-requested', 'merged', 'closed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE declarations (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  github_user_id INTEGER NOT NULL REFERENCES users(github_user_id),
  terms_version TEXT NOT NULL,
  sources_public INTEGER NOT NULL CHECK (sources_public = 1),
  no_confidential_material INTEGER NOT NULL CHECK (no_confidential_material = 1),
  no_ownership_claim INTEGER NOT NULL CHECK (no_ownership_claim = 1),
  accepted_at TEXT NOT NULL
);

CREATE UNIQUE INDEX declarations_submission_idx ON declarations(submission_id);

CREATE TABLE pack_jobs (
  id TEXT PRIMARY KEY,
  request_sha256 TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  requester_type TEXT NOT NULL CHECK (requester_type IN ('anonymous', 'github-user', 'api-key', 'release')),
  requester_id_hash TEXT,
  state TEXT NOT NULL CHECK (state IN ('queued', 'building', 'ready', 'failed', 'expired')),
  normalized_request_json TEXT NOT NULL,
  output_r2_key TEXT,
  output_sha256 TEXT,
  output_size_bytes INTEGER,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE UNIQUE INDEX pack_jobs_request_release_idx ON pack_jobs(request_sha256, dataset_version);
CREATE INDEX pack_jobs_state_idx ON pack_jobs(state);
CREATE INDEX pack_jobs_expiry_idx ON pack_jobs(expires_at);

CREATE TABLE idempotency_keys (
  key_hash TEXT NOT NULL,
  scope TEXT NOT NULL,
  owner_id_hash TEXT NOT NULL,
  result_type TEXT,
  result_id TEXT,
  request_sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (key_hash, scope, owner_id_hash)
);

CREATE INDEX idempotency_expiry_idx ON idempotency_keys(expires_at);

CREATE TABLE quota_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('ip-hash', 'github-user', 'api-key', 'global')),
  subject_id_hash TEXT NOT NULL,
  action TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1 CHECK (amount > 0),
  occurred_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX quota_events_lookup_idx ON quota_events(subject_type, subject_id_hash, action, occurred_at);
CREATE INDEX quota_events_expiry_idx ON quota_events(expires_at);

CREATE TABLE moderation_events (
  id TEXT PRIMARY KEY,
  github_user_id INTEGER REFERENCES users(github_user_id),
  submission_id TEXT REFERENCES submissions(id),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  private_notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX moderation_user_created_idx ON moderation_events(github_user_id, created_at DESC);
CREATE INDEX moderation_submission_created_idx ON moderation_events(submission_id, created_at DESC);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  request_id TEXT,
  actor_type TEXT NOT NULL,
  actor_id_hash TEXT,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  action TEXT NOT NULL,
  result TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE INDEX audit_resource_created_idx ON audit_events(resource_type, resource_id, created_at DESC);
CREATE INDEX audit_actor_created_idx ON audit_events(actor_type, actor_id_hash, created_at DESC);
