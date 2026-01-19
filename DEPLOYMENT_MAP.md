# vkTUNEos DEPLOYMENT MAP
## Complete Branch & File Structure Guide

**Document ID**: VK-DEPLOY-2026-01-18  
**Version**: 1.0.0 RELEASE  
**Authority**: L0 Command from Armand Lefebvre

---

## BRANCH STRUCTURE

```
main (v1.0.0-release)
│
├── v0.1.0-foundation ──────── Session 1: Schema + API + Database
│
├── v0.2.0-core ────────────── Session 2: Integrations + Workflows + Licensing
│
└── v1.0.0-release ─────────── Session 3: UI + Themes + Production Ready
```

---

## GIT COMMANDS TO CREATE BRANCHES

```bash
# Clone or init
git init vkTUNEos
cd vkTUNEos

# After Session 1
git add .
git commit -m "Session 1: Foundation - Schema, API, Database"
git tag v0.1.0-foundation
git branch session-1-foundation

# After Session 2
git add .
git commit -m "Session 2: Core Features - Integrations, Workflows, Licensing"
git tag v0.2.0-core
git branch session-2-core

# After Session 3 (Final)
git add .
git commit -m "Session 3: UI + Themes - Production Release"
git tag v1.0.0-release
git branch session-3-release

# Push all
git push origin main --tags
git push origin session-1-foundation
git push origin session-2-core
git push origin session-3-release
```

---

## COMPLETE FILE TREE (v1.0.0-release)

```
vkTUNEos/
│
├── 📄 package.json              # Dependencies & scripts
├── 📄 tsconfig.json             # TypeScript config
├── 📄 vitest.config.ts          # Test config
├── 📄 vercel.json               # Vercel deployment config
├── 📄 Dockerfile                # Docker build
├── 📄 docker-compose.yml        # Docker compose
├── 📄 LICENSE                   # MIT License
├── 📄 README.md                 # Project readme
│
├── 📄 dashboard.html            # ⭐ COMPLETE UI (Session 3)
├── 📄 CERTIFICATION_REPORT.md   # Test certification
│
├── 📁 src/
│   │
│   ├── 📄 index.ts              # ⭐ MAIN SERVER ENTRY POINT
│   │
│   ├── 📁 core/                 # Session 1 + 2
│   │   ├── 📄 schema.ts         # 5-axis coordinate system
│   │   ├── 📄 validation.ts     # MK.01-MK.10 rules
│   │   ├── 📄 licensing.ts      # Tier limits & features
│   │   ├── 📄 ratelimit.ts      # Rate limiting middleware
│   │   └── 📄 resources.ts      # Usage tracking
│   │
│   ├── 📁 db/                   # Session 1
│   │   └── 📄 database.ts       # SQLite via sql.js
│   │
│   ├── 📁 api/                  # Session 1 + 2
│   │   ├── 📄 coordinates.ts    # Coordinate CRUD
│   │   ├── 📄 tenants.ts        # Multi-tenant management
│   │   ├── 📄 audit.ts          # Audit logging
│   │   ├── 📄 schema.ts         # Schema introspection
│   │   ├── 📄 integrations.ts   # Voice/Stems/Music APIs
│   │   ├── 📄 workflows.ts      # Workflow pipelines
│   │   ├── 📄 usage.ts          # Usage & licensing
│   │   └── 📄 docs.ts           # OpenAPI/Swagger
│   │
│   └── 📁 integrations/         # Session 2
│       ├── 📄 providers.ts      # KitsAI, ElevenLabs, etc.
│       └── 📄 workflows.ts      # WorkflowEngine
│
├── 📁 tests/                    # Session 1 + 2
│   ├── 📄 schema.test.ts        # 41 tests
│   └── 📄 integration.test.ts   # 22 tests
│
└── 📁 sessions/                 # Documentation
    ├── 📄 SESSION_1_COMPLETE.md
    ├── 📄 SESSION_2_COMPLETE.md
    └── 📄 SESSION_3_COMPLETE.md
```

---

## FILE LOAD ORDER (IMPORTANT)

### Backend Startup Order

```
1. src/db/database.ts          # Initialize first (creates SQLite)
2. src/core/schema.ts          # Define coordinate axes
3. src/core/validation.ts      # Load validation rules
4. src/core/licensing.ts       # Load tier definitions
5. src/core/ratelimit.ts       # Rate limit setup
6. src/core/resources.ts       # Usage tracking setup
7. src/integrations/providers.ts  # Provider stubs
8. src/integrations/workflows.ts  # Workflow engine
9. src/api/*.ts                # All API routes
10. src/index.ts               # ⭐ STARTS SERVER (imports everything)
```

### The Main Entry Point

**`src/index.ts`** is the ONLY file you run. It imports everything else.

```bash
# Development
npm run dev    # Runs: npx tsx src/index.ts

# Production
npm run build  # Compiles TypeScript
npm start      # Runs compiled JS
```

---

## DEPLOYMENT OPTIONS

### Option A: Local Development (Fastest)

```bash
# 1. Unzip
unzip vkTUNEos-v1.0.0-RELEASE.zip
cd vkTUNEos

# 2. Install
npm install

# 3. Run tests (optional)
npm test

# 4. Start server
npm run dev

# 5. Access
# API:       http://localhost:3000/api/v1
# Docs:      http://localhost:3000/api/v1/docs
# Dashboard: Open dashboard.html in browser
```

### Option B: Docker (Production)

```bash
# 1. Build and run
docker-compose up -d

# 2. Access
# API:       http://localhost:3000/api/v1
# Dashboard: http://localhost:3000/dashboard.html
```

### Option C: Vercel (Cloud)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel deploy

# 3. Access at your Vercel URL
```

### Option D: Dashboard Only (No Backend)

```bash
# Just open the file - it's self-contained
open dashboard.html

# Or serve it
npx serve -s .
# Access: http://localhost:3000/dashboard.html
```

---

## WHAT EACH SESSION ADDED

### Session 1: v0.1.0-foundation
```
Added:
├── src/core/schema.ts
├── src/core/validation.ts
├── src/db/database.ts
├── src/api/coordinates.ts
├── src/api/tenants.ts
├── src/api/audit.ts
├── src/api/schema.ts
├── src/index.ts (basic)
├── tests/schema.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Session 2: v0.2.0-core
```
Added:
├── src/core/licensing.ts      # NEW
├── src/core/ratelimit.ts      # NEW
├── src/core/resources.ts      # NEW
├── src/integrations/providers.ts  # NEW
├── src/integrations/workflows.ts  # NEW
├── src/api/integrations.ts    # NEW
├── src/api/workflows.ts       # NEW
├── src/api/usage.ts           # NEW
├── src/api/docs.ts            # NEW
├── src/index.ts               # UPDATED (added routes)
├── tests/integration.test.ts  # NEW
├── Dockerfile                 # NEW
├── docker-compose.yml         # NEW
├── vercel.json                # NEW
└── CERTIFICATION_REPORT.md    # NEW
```

### Session 3: v1.0.0-release
```
Added:
├── dashboard.html             # NEW (Complete UI)
└── sessions/SESSION_3_COMPLETE.md
```

---

## DEPENDENCY CHAIN

```
┌─────────────────────────────────────────────────────────────┐
│                        src/index.ts                         │
│                    (Main Entry Point)                       │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ db/     │     │ core/   │     │ api/    │
    │database │◄────│ *       │◄────│ *       │
    └─────────┘     └─────────┘     └─────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │integrations/│
                   │ providers   │
                   │ workflows   │
                   └─────────────┘
```

### Import Dependencies:
- `database.ts` → standalone (no imports from project)
- `schema.ts` → standalone
- `validation.ts` → imports `schema.ts`
- `licensing.ts` → imports `database.ts`
- `ratelimit.ts` → imports `licensing.ts`
- `resources.ts` → imports `database.ts`
- `providers.ts` → imports `resources.ts`
- `workflows.ts` → imports `providers.ts`
- `api/*.ts` → imports from `core/`, `db/`, `integrations/`
- `index.ts` → imports EVERYTHING

---

## QUICK START CHECKLIST

```
□ 1. Unzip vkTUNEos-v1.0.0-RELEASE.zip
□ 2. cd vkTUNEos
□ 3. npm install
□ 4. npm test (verify 63/63 pass)
□ 5. npm run dev (start server)
□ 6. Open http://localhost:3000/api/v1 (verify API)
□ 7. Open http://localhost:3000/api/v1/docs (Swagger UI)
□ 8. Open dashboard.html in browser (Full UI)
□ 9. Done! ✅
```

---

## TROUBLESHOOTING

### "Module not found"
```bash
# Make sure you ran npm install
npm install
```

### "Database not initialized"
```bash
# The server auto-initializes on startup
# If running tests, they handle init themselves
npm test
```

### "Port 3000 in use"
```bash
# Change port
PORT=3001 npm run dev
```

### "Dashboard not loading"
```bash
# Dashboard is standalone HTML
# Just open it directly - no server needed
open dashboard.html
```

---

## SUMMARY

| Branch | Version | What's Included |
|--------|---------|-----------------|
| `session-1-foundation` | v0.1.0 | Schema, API, Database, 41 tests |
| `session-2-core` | v0.2.0 | + Integrations, Workflows, Licensing, 63 tests |
| `session-3-release` / `main` | v1.0.0 | + Dashboard UI, 5 Themes, Production Ready |

**Start with `main` branch (v1.0.0) for the complete system.**

---

*Vector Authority v1.0 Compliant | ValidKernel Ecosystem | vkTUNEos.com*
