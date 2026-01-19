/**
 * vkTUNEos Music Kernel Server
 * Main entry point - Session 2 Complete
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './db/database.js';
import { initResourceTracking } from './core/resources.js';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Routes
import coordinatesRouter from './api/coordinates.js';
import tenantsRouter from './api/tenants.js';
import auditRouter from './api/audit.js';
import schemaRouter from './api/schema.js';
import integrationsRouter from './api/integrations.js';
import workflowsRouter from './api/workflows.js';
import usageRouter from './api/usage.js';
import docsRouter from './api/docs.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false // Allow Swagger UI
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-User-ID', 'X-Correlation-ID']
}));

// Request logging
app.use(morgan('combined'));

// JSON body parsing
app.use(express.json({ limit: '10mb' }));

// Serve static files (dashboard.html)
app.use(express.static(path.join(__dirname, '..')));

// Serve dashboard at root
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'dashboard.html'));
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    kernel: 'vkTUNEos Music Kernel',
    session: 2
  });
});

// ============================================================================
// API INFO
// ============================================================================

app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    name: 'vkTUNEos Music Kernel API',
    version: '1.0.0',
    domain: 'vkTUNEos.com',
    parent_authority: 'VectorAuthority.com',
    session: 2,
    endpoints: {
      coordinates: '/api/v1/coordinates',
      tenants: '/api/v1/tenants',
      audit: '/api/v1/audit',
      schema: '/api/v1/schema',
      integrations: '/api/v1/integrations',
      workflows: '/api/v1/workflows',
      usage: '/api/v1/usage',
      docs: '/api/v1/docs'
    },
    features: {
      voice_cloning: ['KitsAI', 'ElevenLabs'],
      stem_separation: ['LALAL.AI'],
      music_generation: ['Suno', 'Udio'],
      audio_production: ['LANDR'],
      workflows: ['text-to-music', 'lyrics-to-song', 'remix']
    },
    tiers: ['free', 'premium', 'enterprise']
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

// Session 1 Routes
app.use('/api/v1/coordinates', coordinatesRouter);
app.use('/api/v1/tenants', tenantsRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/schema', schemaRouter);

// Session 2 Routes
app.use('/api/v1/integrations', integrationsRouter);
app.use('/api/v1/workflows', workflowsRouter);
app.use('/api/v1/usage', usageRouter);
app.use('/api/v1/docs', docsRouter);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
    path: req.path,
    docs: '/api/v1/docs'
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Initialize for serverless (Vercel)
let initialized = false;
async function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  console.log('[Server] Initializing database...');
  await initDatabase();
  console.log('[Server] Initializing resource tracking...');
  initResourceTracking();
}

// For serverless: initialize on first request
app.use(async (req, res, next) => {
  await ensureInitialized();
  next();
});

// Start server only when not on Vercel
if (!process.env.VERCEL) {
  ensureInitialized().then(() => {
    app.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██╗   ██╗██╗  ██╗████████╗██╗   ██╗███╗   ██╗███████╗       ║
║   ██║   ██║██║ ██╔╝╚══██╔══╝██║   ██║████╗  ██║██╔════╝       ║
║   ██║   ██║█████╔╝    ██║   ██║   ██║██╔██╗ ██║█████╗         ║
║   ╚██╗ ██╔╝██╔═██╗    ██║   ██║   ██║██║╚██╗██║██╔══╝         ║
║    ╚████╔╝ ██║  ██╗   ██║   ╚██████╔╝██║ ╚████║███████╗       ║
║     ╚═══╝  ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝       ║
║                                                               ║
║   Music Kernel v1.0 | vkTUNEos.com                            ║
║   Port: ${PORT}                                                   ║
║   Docs: http://localhost:${PORT}/api/v1/docs                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  }).catch(err => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  });
}

export default app;
