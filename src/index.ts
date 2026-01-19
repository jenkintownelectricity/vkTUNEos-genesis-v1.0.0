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
import projectsRouter from './api/projects.js';
import studioRouter from './api/studio.js';
import killerFeaturesRouter from './api/killer-features.js';

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

// ============================================================================
// DATABASE INITIALIZATION (must be before routes!)
// ============================================================================

let initialized = false;
async function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  console.log('[Server] Initializing database...');
  await initDatabase();
  console.log('[Server] Initializing resource tracking...');
  initResourceTracking();
  console.log('[Server] Initialization complete!');
}

// For serverless: initialize on first request (BEFORE routes)
app.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureInitialized();
    next();
  } catch (err: any) {
    console.error('[Server] Init failed:', err);
    res.status(500).json({
      error: 'Server initialization failed',
      message: err?.message || 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined
    });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '..')));
app.use('/app', express.static(path.join(__dirname, '..', 'frontend')));

// Serve frontend at root
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
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
    name: 'vkTUNEos Full Stack API',
    version: '1.0.0',
    domain: 'vkTUNEos.com',
    parent_authority: 'VectorAuthority.com',
    tagline: 'Open-Source AI Media Production Platform',
    philosophy: 'Zero data collection. Your data stays yours. Works offline.',
    session: 5,
    endpoints: {
      // Core
      coordinates: '/api/v1/coordinates',
      tenants: '/api/v1/tenants',
      audit: '/api/v1/audit',
      schema: '/api/v1/schema',
      // Integrations
      integrations: '/api/v1/integrations',
      workflows: '/api/v1/workflows',
      usage: '/api/v1/usage',
      docs: '/api/v1/docs',
      // Projects
      projects: '/api/v1/projects',
      // AI Studio
      studio: '/api/v1/studio',
      // Killer Features
      killer: '/api/v1/killer'
    },
    tier1_features: {
      music_generation: ['MusicGen', 'AudioCraft'],
      voice_cloning: ['RVC v3', 'OpenVoice'],
      stem_separation: ['Demucs', 'UVR5', '10-stem'],
      video_generation: ['Open-Sora', 'CogVideo'],
      video_editing: ['FFmpeg', 'Auto-cut'],
      auto_captions: ['Whisper', 'Styled CSS']
    },
    tier2_differentiators: [
      'Stem control in generation',
      'Voice-to-any-voice singing',
      'Coordinate-based assets',
      'Zero data collection',
      'Offline mode',
      'One-file .vktune format',
      'Multi-platform export',
      'Git-like version control'
    ],
    tier3_killers: [
      'AI Collaborator (natural language control)',
      'Voice Marketplace',
      'Remix Rights Tracking',
      'Copyright Shield',
      'Mood-to-Music',
      'Lip Sync Video'
    ],
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

// Session 3 Routes - Semantic Compression & Single-File Projects
app.use('/api/v1/projects', projectsRouter);

// Session 4 Routes - AI Studio (Music, Voice, Stems, Video)
app.use('/api/v1/studio', studioRouter);

// Session 5 Routes - Killer Features (Tier 3)
app.use('/api/v1/killer', killerFeaturesRouter);

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
