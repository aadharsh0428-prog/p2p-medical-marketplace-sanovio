# P2P Medical Supplies Marketplace

A peer-to-peer marketplace for hospitals to trade surplus medical supplies with AI-powered product mapping.

## Architecture

**Backend:** Node.js + TypeScript + Express + Prisma + PostgreSQL
**Frontend:** React + TypeScript + Vite

## Quick Start

### Backend
```bash
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
npx prisma migrate dev --name init
npx prisma generate
npm run seed
npm run dev  # Port 3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Port 3000
```

## Features

✅ Excel/CSV upload with field validation
✅ Hybrid AI + deterministic product mapping
✅ Transactional anti-oversell reservation logic
✅ Semantic search with relevance ranking
✅ Complete marketplace workflow (upload → map → list → search → purchase)

## Database Schema

- **RawProduct**: Original uploaded data (immutable)
- **CanonicalProduct**: Standardized product catalog
- **ProductMapping**: Links raw to canonical (with confidence scores)
- **Listing**: Marketplace inventory
- **Reservation**: Time-limited purchase holds
- **Order**: Completed transactions

## API Endpoints

- POST /api/upload - Upload Excel file
- GET /api/mapping/suggestions/:id - Get AI mapping suggestions
- POST /api/listings - Create listing
- POST /api/search - Semantic search
- POST /api/reservations - Reserve inventory
- POST /api/reservations/:id/checkout - Complete purchase

## Design Principles

1. AI assists, canonical data guarantees safety
2. Deterministic rules (GTIN → SKU) before AI
3. Serializable transactions prevent race conditions
4. Original data never modified

## Tech Highlights

- **Anti-oversell**: Row-level locking in transactions
- **Semantic similarity**: Jaccard + Levenshtein (no external APIs)
- **Confidence policy**: >90% auto-accept, 60-90% needs review
- **Background jobs**: Auto-expire reservations (15 min timeout)

## Sample Data

Includes seed script with 10 canonical products matching sample Excel data.
