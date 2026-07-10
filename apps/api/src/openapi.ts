import { jsonResponse } from './http.js'

export function handleOpenApi(): Response {
  const spec = {
    openapi: '3.1.0',
    info: {
      title: 'Open Brands API',
      version: '1.0.0',
      description: 'Public API for reviewed brand logos, colors, metadata, and sources.',
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    },
    servers: [
      { url: 'https://api.open-brands.org', description: 'Production' },
      { url: 'http://localhost:8787', description: 'Local development' },
    ],
    paths: {
      '/v1/meta': {
        get: {
          summary: 'Get release metadata',
          tags: ['meta'],
          responses: {
            '200': { description: 'Release manifest', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReleaseManifest' } } } },
          },
        },
      },
      '/v1/brands': {
        get: {
          summary: 'List brands',
          tags: ['brands'],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'tag', in: 'query', schema: { type: 'string' } },
            { name: 'sort', in: 'query', schema: { type: 'string', enum: ['name', 'id'], default: 'name' } },
          ],
          responses: {
            '200': { description: 'Paginated brand list' },
          },
        },
      },
      '/v1/brands/{id}': {
        get: {
          summary: 'Get brand detail',
          tags: ['brands'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'Brand detail' },
            '404': { description: 'Brand not found' },
          },
        },
      },
      '/v1/brands/{id}/colors': {
        get: {
          summary: 'Get brand colors',
          tags: ['brands', 'colors'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Brand colors' }, '404': { description: 'Brand not found' } },
        },
      },
      '/v1/brands/{id}/assets': {
        get: {
          summary: 'Get brand assets',
          tags: ['brands', 'assets'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'theme', in: 'query', schema: { type: 'string', enum: ['light', 'dark', 'any'] } },
            { name: 'current', in: 'query', schema: { type: 'boolean' } },
          ],
          responses: { '200': { description: 'Brand assets' }, '404': { description: 'Brand not found' } },
        },
      },
      '/v1/brands/{id}/image': {
        get: {
          summary: 'Redirect to brand image',
          tags: ['brands', 'assets'],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'type', in: 'query', schema: { type: 'string' } },
            { name: 'theme', in: 'query', schema: { type: 'string' } },
            { name: 'format', in: 'query', schema: { type: 'string', enum: ['svg', 'png', 'webp'] } },
          ],
          responses: { '302': { description: 'Redirect to CDN asset' }, '404': { description: 'Brand or asset not found' } },
        },
      },
      '/v1/resolve/{query}': {
        get: {
          summary: 'Resolve brand by name, alias, or domain',
          tags: ['resolve'],
          parameters: [{ name: 'query', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Resolved brand' }, '404': { description: 'No match' } },
        },
      },
      '/v1/search': {
        get: {
          summary: 'Search brands',
          tags: ['search'],
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
          ],
          responses: { '200': { description: 'Search results' }, '400': { description: 'Missing query' } },
        },
      },
      '/v1/categories': {
        get: { summary: 'List categories', tags: ['categories'], responses: { '200': { description: 'Category tree' } } },
      },
      '/v1/collections': {
        get: { summary: 'List collections', tags: ['collections'], responses: { '200': { description: 'Collection list' } } },
      },
      '/v1/packs': {
        post: {
          summary: 'Create a brand pack',
          tags: ['packs'],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/PackRequest' } } } },
          responses: {
            '202': { description: 'Pack queued' },
            '200': { description: 'Existing pack found' },
            '503': { description: 'Pack service not configured' },
          },
        },
      },
      '/v1/packs/{id}': {
        get: {
          summary: 'Get pack status',
          tags: ['packs'],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'Pack status' }, '404': { description: 'Pack not found' } },
        },
      },
    },
    components: {
      schemas: {
        ReleaseManifest: {
          type: 'object',
          properties: {
            datasetVersion: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            brandCount: { type: 'integer' },
            assetCount: { type: 'integer' },
            checksum: { type: 'string' },
          },
        },
        PackRequest: {
          type: 'object',
          required: ['assetTypes', 'themes', 'formats', 'metadata', 'folderLayout', 'filenameStrategy', 'includeHistorical', 'missingPolicy'],
          properties: {
            brandIds: { type: 'array', items: { type: 'string' }, maxItems: 100 },
            collectionId: { type: 'string' },
            assetTypes: { type: 'array', items: { type: 'string' } },
            themes: { type: 'array', items: { type: 'string' } },
            formats: { type: 'array', items: { type: 'string' } },
            metadata: { type: 'string', enum: ['none', 'compact', 'complete'] },
            folderLayout: { type: 'string', enum: ['flat', 'by-brand'] },
            filenameStrategy: { type: 'string', enum: ['stable-id', 'descriptive'] },
            includeHistorical: { type: 'boolean' },
            includeProvenance: { type: 'boolean' },
            missingPolicy: { type: 'string', enum: ['strict', 'recommended-fallback', 'skip'] },
          },
        },
      },
    },
  }

  return jsonResponse(spec)
}
