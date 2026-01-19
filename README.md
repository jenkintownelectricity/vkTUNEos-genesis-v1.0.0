# vkTUNEos Music Kernel

<p align="center">
  <strong>Vector Authority v1.0 Compliant | ValidKernel Ecosystem</strong>
</p>

<p align="center">
  AI Music Infrastructure with Deterministic Validation
</p>

---

## Overview

vkTUNEos is a **Music Kernel** within the ValidKernel ecosystem, providing structured data management for:

- 🎤 **AI Voice Cloning & Synthesis**
- 🎵 **Audio Stem Separation**
- 🎹 **Music Generation**
- 🎙️ **Vocal Processing**
- 🎚️ **Audio Production Workflows**
- 📜 **Licensing & Rights Management**

Built on the **Vector Authority v1.0** specification with 5-axis coordinate addressing and deterministic validation.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/BuildingSystemsAI/vkTUNEos.git
cd vkTUNEos

# Install dependencies
npm install

# Run development server
npm run dev

# Or use Docker
docker-compose up -d
```

## Architecture

### Coordinate System

All data is addressed via 5-axis coordinates:

```
Music.{Category}.{Domain}.{Entity}.{Attribute}.{State}
```

Example: `Music.VoiceCloning.Tool.KitsAI.Fidelity.Validated`

### Axes

| Axis | Name | Values |
|------|------|--------|
| L1 | Category | VoiceCloning, StemSeparation, MusicGeneration, VocalProcessing, AudioProduction, Licensing |
| L2 | Domain | Model, Tool, Workflow, Asset, Rights, Quality |
| L3 | Entity | PascalCase identifier (e.g., KitsAI, ElevenLabs) |
| L4 | Attribute | Fidelity, Latency, Languages, Formats, Pricing, API, Emotion, Range, Stems, Commercial |
| L5 | State | Draft, Proposed, Validated, Deprecated, Archived |

### Validation Rules

The Music Kernel enforces 10 domain-specific rules:

| Code | Rule |
|------|------|
| MK.01 | Voice clones MUST include source consent flag |
| MK.02 | Stem separation MUST specify neural network model |
| MK.03 | Generated music MUST declare training data provenance |
| MK.04 | Commercial use MUST have Licensing.Rights coordinate |
| MK.05 | API responses MUST include latency measurement |
| MK.06 | Emotion parameters MUST be numeric (0-100) |
| MK.07 | Language codes MUST follow ISO 639-1 |
| MK.08 | Audio formats MUST specify bit depth and sample rate |
| MK.09 | Pricing MUST distinguish one-time vs subscription |
| MK.10 | Quality scores MUST be reproducible benchmarks |

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/coordinates` | List coordinates |
| POST | `/api/v1/coordinates` | Create coordinate |
| GET | `/api/v1/coordinates/:id` | Get coordinate |
| PUT | `/api/v1/coordinates/:id` | Update coordinate |
| DELETE | `/api/v1/coordinates/:id` | Delete coordinate |
| GET | `/api/v1/coordinates/resolve/:path` | Resolve by path |
| POST | `/api/v1/coordinates/validate` | Validate without creating |
| POST | `/api/v1/coordinates/bulk` | Bulk create |
| GET | `/api/v1/tenants` | List tenants |
| POST | `/api/v1/tenants` | Create tenant |
| GET | `/api/v1/audit` | List audit events |
| GET | `/api/v1/schema` | Get schema definition |

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| X-Tenant-ID | Yes* | Tenant identifier |
| X-User-ID | No | User identifier for audit |
| X-Correlation-ID | No | Request correlation ID |

*Required for coordinate and audit endpoints

### Example: Create Coordinate

```bash
curl -X POST http://localhost:3000/api/v1/coordinates \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: your-tenant-id" \
  -d '{
    "L1_category": "VoiceCloning",
    "L2_domain": "Tool",
    "L3_entity": "KitsAI",
    "L4_attribute": "Fidelity",
    "L5_state": "Validated",
    "value": 8,
    "metadata": {
      "source_consent": true,
      "benchmark_method": "MOS"
    }
  }'
```

## Multi-Tenancy

vkTUNEos supports three isolation levels:

| Level | Description | Use Case |
|-------|-------------|----------|
| Logical | Row-level security | Free, Premium |
| Schema | Schema-per-tenant | Enterprise |
| Database | Database-per-tenant | Enterprise+ |

## Projections

Pre-defined views for common use cases:

- **voice_library**: VoiceCloning → Model
- **stem_splitter**: StemSeparation → Asset
- **music_studio**: MusicGeneration → Workflow
- **licensing_hub**: Licensing → *
- **quality_dashboard**: * → Fidelity
- **pricing_comparator**: * → Tool → Pricing

## License Tiers

| Feature | Free | Premium | Enterprise |
|---------|------|---------|------------|
| Voice Clone Slots | 1 | 10 | Unlimited |
| Stem Separation | 2-stem | 10-stem | 10-stem |
| Music Generation | 2 min | 30 min | Unlimited |
| Multi-Tenant | No | Up to 10 | Unlimited |
| White-Label | No | Yes | Yes |
| API Rate Limit | 100/day | 5,000/day | Custom |
| Support | Community | Priority Email | Dedicated |

See [LICENSE](./LICENSE) for full terms.

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
vkTUNEos/
├── src/
│   ├── core/           # Schema and validation
│   │   ├── schema.ts   # Axis definitions
│   │   └── validation.ts # MK.01-MK.10 rules
│   ├── db/             # Database layer
│   │   └── database.ts # SQLite + tenant isolation
│   ├── api/            # REST endpoints
│   │   ├── coordinates.ts
│   │   ├── tenants.ts
│   │   ├── audit.ts
│   │   └── schema.ts
│   └── index.ts        # Server entry point
├── tests/              # Test suites
├── config/             # Configuration files
├── docs/               # Documentation
└── sessions/           # Build session handoffs
```

## Deployment

### Docker

```bash
docker build -t vktuneos .
docker run -p 3000:3000 vktuneos
```

### Vercel

```bash
npx vercel deploy
```

### Manual

```bash
npm run build
NODE_ENV=production npm start
```

## Session-Based Development

This project follows a 3-session build strategy:

| Session | Focus | Status |
|---------|-------|--------|
| 1 | Foundation + Schema | ✅ Complete |
| 2 | Core Features + API | 🔄 Pending |
| 3 | UI + Themes + Polish | ⏳ Pending |

## Links

- **Domain**: [vkTUNEos.com](https://vktuneos.com)
- **Parent Authority**: [VectorAuthority.com](https://vectorauthority.com)
- **ValidKernel**: [ValidKernel.com](https://validkernel.com)
- **GitHub**: [BuildingSystemsAI/vkTUNEos](https://github.com/BuildingSystemsAI/vkTUNEos)

## Authority

```
ISSUED_BY: Armand Lefebvre
AUTHORITY: L0 Canonical
DOMAIN: vkTUNEos.com
PARENT: VectorAuthority.com
VERSION: 1.0
```

---

<p align="center">
  <sub>Built with ❤️ by Lefebvre Design Solutions LLC</sub>
</p>
