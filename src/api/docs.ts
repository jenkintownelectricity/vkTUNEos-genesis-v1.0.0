/**
 * vkTUNEos OpenAPI Documentation
 * Swagger UI at /api/v1/docs
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import { Router, Request, Response } from 'express';

const router = Router();

// ============================================================================
// OPENAPI SPECIFICATION
// ============================================================================

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'vkTUNEos Music Kernel API',
    description: `
# vkTUNEos Music Kernel

Vector Authority v1.0 Compliant API for AI Music Infrastructure.

## Authentication

All requests require a tenant ID via \`X-Tenant-ID\` header.

## Rate Limits

| Tier | Requests/min | Requests/day |
|------|-------------|--------------|
| Free | 5 | 100 |
| Premium | 30 | 5,000 |
| Enterprise | 100 | Unlimited |

## Coordinate System

\`Music.{Category}.{Domain}.{Entity}.{Attribute}.{State}\`
    `,
    version: '1.0.0',
    contact: { name: 'vkTUNEos', url: 'https://vktuneos.com' }
  },
  servers: [{ url: '/api/v1', description: 'API v1' }],
  tags: [
    { name: 'Coordinates', description: 'Vector Authority coordinate management' },
    { name: 'Tenants', description: 'Multi-tenant management' },
    { name: 'Integrations', description: 'AI service integrations' },
    { name: 'Workflows', description: 'Multi-step pipelines' },
    { name: 'Usage', description: 'Resource usage & licensing' },
    { name: 'Schema', description: 'Schema introspection' },
    { name: 'Audit', description: 'Audit logging' }
  ],
  paths: {
    '/coordinates': {
      get: { tags: ['Coordinates'], summary: 'List coordinates', responses: { '200': { description: 'Success' } } },
      post: { tags: ['Coordinates'], summary: 'Create coordinate', responses: { '201': { description: 'Created' } } }
    },
    '/coordinates/{id}': {
      get: { tags: ['Coordinates'], summary: 'Get coordinate', responses: { '200': { description: 'Success' } } },
      put: { tags: ['Coordinates'], summary: 'Update coordinate', responses: { '200': { description: 'Updated' } } },
      delete: { tags: ['Coordinates'], summary: 'Delete coordinate', responses: { '200': { description: 'Deleted' } } }
    },
    '/coordinates/validate': {
      post: { tags: ['Coordinates'], summary: 'Validate coordinate', responses: { '200': { description: 'Validation result' } } }
    },
    '/integrations/voice/clone': {
      post: { tags: ['Integrations'], summary: 'Create voice clone', responses: { '201': { description: 'Created' } } }
    },
    '/integrations/voice/synthesize': {
      post: { tags: ['Integrations'], summary: 'Synthesize speech', responses: { '200': { description: 'Audio generated' } } }
    },
    '/integrations/stems/separate': {
      post: { tags: ['Integrations'], summary: 'Separate stems', responses: { '200': { description: 'Stems separated' } } }
    },
    '/integrations/music/generate': {
      post: { tags: ['Integrations'], summary: 'Generate music', responses: { '200': { description: 'Music generated' } } }
    },
    '/integrations/production/master': {
      post: { tags: ['Integrations'], summary: 'AI mastering', responses: { '200': { description: 'Mastered' } } }
    },
    '/integrations/providers': {
      get: { tags: ['Integrations'], summary: 'List providers', responses: { '200': { description: 'Provider list' } } }
    },
    '/workflows/text-to-music': {
      post: { tags: ['Workflows'], summary: 'Text to Music', responses: { '201': { description: 'Workflow started' } } }
    },
    '/workflows/lyrics-to-song': {
      post: { tags: ['Workflows'], summary: 'Lyrics to Song', responses: { '201': { description: 'Workflow started' } } }
    },
    '/workflows/remix': {
      post: { tags: ['Workflows'], summary: 'Remix', responses: { '201': { description: 'Workflow started' } } }
    },
    '/workflows': {
      get: { tags: ['Workflows'], summary: 'List workflows', responses: { '200': { description: 'Workflow list' } } }
    },
    '/workflows/{id}': {
      get: { tags: ['Workflows'], summary: 'Get workflow', responses: { '200': { description: 'Workflow details' } } }
    },
    '/usage': {
      get: { tags: ['Usage'], summary: 'Get usage', responses: { '200': { description: 'Usage data' } } }
    },
    '/usage/license': {
      get: { tags: ['Usage'], summary: 'License info', responses: { '200': { description: 'License details' } } }
    },
    '/usage/tiers': {
      get: { tags: ['Usage'], summary: 'List tiers', responses: { '200': { description: 'Tier definitions' } } }
    },
    '/tenants': {
      get: { tags: ['Tenants'], summary: 'List tenants', responses: { '200': { description: 'Tenant list' } } },
      post: { tags: ['Tenants'], summary: 'Create tenant', responses: { '201': { description: 'Created' } } }
    },
    '/schema': {
      get: { tags: ['Schema'], summary: 'Get schema', responses: { '200': { description: 'Schema' } } }
    },
    '/schema/axes': {
      get: { tags: ['Schema'], summary: 'Get axes', responses: { '200': { description: 'Axes' } } }
    },
    '/schema/rules': {
      get: { tags: ['Schema'], summary: 'Get rules', responses: { '200': { description: 'Rules' } } }
    },
    '/audit': {
      get: { tags: ['Audit'], summary: 'List events', responses: { '200': { description: 'Audit log' } } }
    }
  },
  components: {
    schemas: {
      Coordinate: {
        type: 'object',
        properties: {
          L1_category: { type: 'string', enum: ['VoiceCloning', 'StemSeparation', 'MusicGeneration', 'VocalProcessing', 'AudioProduction', 'Licensing'] },
          L2_domain: { type: 'string', enum: ['Model', 'Tool', 'Workflow', 'Asset', 'Rights', 'Quality'] },
          L3_entity: { type: 'string' },
          L4_attribute: { type: 'string', enum: ['Fidelity', 'Latency', 'Languages', 'Formats', 'Pricing', 'API', 'Emotion', 'Range', 'Stems', 'Commercial'] },
          L5_state: { type: 'string', enum: ['Draft', 'Proposed', 'Validated', 'Deprecated', 'Archived'] }
        }
      }
    },
    securitySchemes: {
      TenantId: { type: 'apiKey', in: 'header', name: 'X-Tenant-ID' }
    }
  }
};

// ============================================================================
// SWAGGER UI HTML
// ============================================================================

const swaggerHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>vkTUNEos API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    .topbar { display: none !important; }
    body { margin: 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/v1/docs/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: 'StandaloneLayout'
    });
  </script>
</body>
</html>
`;

// ============================================================================
// ROUTES
// ============================================================================

router.get('/', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(swaggerHtml);
});

router.get('/openapi.json', (req: Request, res: Response) => {
  res.json(openApiSpec);
});

export default router;
