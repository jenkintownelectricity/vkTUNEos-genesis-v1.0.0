/**
 * vkTUNEos Music Kernel Server
 * Main entry point
 * 
 * Domain: vkTUNEos.com
 * Version: 1.0
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { initDatabase } from './db/database.js';
import coordinatesRouter from './api/coordinates.js';
import tenantsRouter from './api/tenants.js';
import auditRouter from './api/audit.js';
import schemaRouter from './api/schema.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet());

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
// HEALTH CHECK
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    kernel: 'vkTUNEos Music Kernel'
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
    endpoints: {
      coordinates: '/api/v1/coordinates',
      tenants: '/api/v1/tenants',
      audit: '/api/v1/audit',
      schema: '/api/v1/schema'
    },
    documentation: '/api/v1/docs'
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/v1/coordinates', coordinatesRouter);
app.use('/api/v1/tenants', tenantsRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/schema', schemaRouter);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    code: 'NOT_FOUND',
    path: req.path
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

async function main() {
  try {
    // Initialize database
    console.log('[Server] Initializing database...');
    await initDatabase();
    
    // Start server
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
║   Music Kernel v1.0 | Vector Authority Compliant              ║
║   Domain: vkTUNEos.com                                        ║
║   Port: ${PORT}                                                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
  }
}

main();

export default app;
