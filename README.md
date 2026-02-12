# 🏥 P2P Medical Supplies Marketplace

> A modern peer-to-peer platform where hospitals can safely trade surplus medical supplies with AI-powered intelligent recommendations.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

---

## 📋 Table of Contents

- [What This Application Does](#-what-this-application-does)
- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Technical Architecture](#-technical-architecture)
- [API Documentation](#-api-documentation)
- [Smart Features](#-smart-features)
- [Contributing](#-contributing)

---

## 🎯 What This Application Does

### For Non-Technical Users

This is a **marketplace platform** specifically designed for hospitals to:

1. **List surplus medical supplies** they no longer need
2. **Search for supplies** other hospitals are selling
3. **Complete purchases** securely and efficiently
4. **Get smart recommendations** on what to buy based on their purchase history

**Think of it like:** Amazon or eBay, but exclusively for hospitals trading medical supplies with AI helping you find what you need.

---

## ✨ Key Features

### 🏠 **Dashboard**
Your command center where you can:
- **View Statistics**: See total listings, active items, items under review, and expiring products
- **Manage Inventory**: Activate or delete product listings
- **Track Performance**: Monitor marketplace activity in real-time
- **Get AI Recommendations**: See personalized product suggestions based on your browsing and purchase history

![Dashboard Screenshot](./ui_frontend_login.png)
![Dashboard Screenshot](./ui_frontend_dashboard_before_upload.png)

### 📤 **Smart Upload System**
Upload your inventory effortlessly:
- **Excel/CSV Support**: Upload files with your product data
- **Automatic Validation**: System checks for errors (missing prices, invalid dates, duplicates)
- **Review Before Publishing**: All uploads go to "Under Review" status first
- **Bulk Processing**: Upload hundreds of products at once

![Dashboard Screenshot](./ui_frontend_after_upload.png)

### 🔍 **Intelligent Search**
Find products using advanced search:
- **Fuzzy Matching**: Find "surgicle gloves" even if you type "surgical glove" (handles typos)
- **Semantic Search**: Understands context (searching "umbilical" shows neonatal supplies)
- **Smart Ranking**: Most relevant results appear first
- **Filter & Sort**: Narrow down by category, price, quantity

![Dashboard Screenshot](./ui_frontend_marketplace.png)

### 🤖 **AI-Powered Recommendations**
Get personalized suggestions:
- **Purchase History Analysis**: Recommends products similar to what you've bought
- **Behavioral Patterns**: Learns from your browsing habits
- **Category Matching**: Suggests products in categories you frequently purchase
- **No External APIs**: All AI runs locally (100% free, no data leaves your server)

![Dashboard Screenshot](./ui_frontend_recommendation)

### ✅ **Review & Approval Workflow**
Control what gets published:
1. Upload creates **DRAFT** listings
2. Review products in dashboard
3. Click "Activate" to make them searchable
4. Or delete if not needed

### 🛒 **Secure Checkout**
Complete transactions safely:
- **Time-Limited Reservations**: 15-minute holds prevent overselling
- **Anti-Oversell Protection**: Database locks ensure inventory accuracy
- **Order Tracking**: Monitor purchase status

![Dashboard Screenshot](ui_frontend_checkout.png)

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

### Option 1: Using Docker (Recommended)

**Start PostgreSQL database:**

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: marketplace
      POSTGRES_PASSWORD: marketplace123
      POSTGRES_DB: p2p_marketplace
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Start database
docker-compose up -d

# Verify it's running
docker ps
```

### Option 2: Manual PostgreSQL Setup

```bash
# Create database
createdb p2p_marketplace

# Or using psql:
psql -U postgres
CREATE DATABASE p2p_marketplace;
\q
```

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/p2p-medical-marketplace.git
cd p2p-medical-marketplace

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Set up environment variables
cp .env.example .env

# Edit .env file with your database credentials:
# DATABASE_URL=postgresql://marketplace:marketplace123@localhost:5432/p2p_marketplace
# JWT_SECRET=your-super-secret-key-change-this
# PORT=3001
# NODE_ENV=development

# 5. Run database migrations (creates tables)
npx prisma migrate deploy

# 6. Generate Prisma Client
npx prisma generate

# 7. (Optional) Seed sample data
npx prisma db seed
```

### Run the Application

**Terminal 1 - Backend:**
```bash
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

**Access the application:**
- 🌐 Frontend: http://localhost:5173
- 🔧 API: http://localhost:3001

---

## 📖 How It Works

### For Hospital Staff (Non-Technical)

#### 1️⃣ **Login to Your Dashboard**
- Access your hospital's account
- See overview of your inventory
- View marketplace statistics

#### 2️⃣ **Upload Your Inventory**
- Click "Upload Products" button
- Select your Excel file (template provided)
- System validates data automatically
- Products appear in "Under Review" section

**Excel File Format:**
```
Name                          | GTIN          | Category    | Quantity | Price | Expiry Date
Surgical Gloves Sterile       | 7612345678901 | Surgical    | 500      | 0.25  | 2026-12-31
Foley Catheter 2-way 16 Fr    | 5012345600007 | Catheters   | 300      | 3.50  | 2027-06-15
```

#### 3️⃣ **Review & Activate Listings**
- Check uploaded products
- Verify prices and quantities
- Click "Activate" to publish to marketplace
- Or "Delete" if incorrect

#### 4️⃣ **Browse Recommendations**
- See personalized product suggestions
- Based on your purchase history
- Click to view details or buy

#### 5️⃣ **Search Marketplace**
- Go to "Search Marketplace"
- Type what you need (e.g., "surgical gloves")
- View results ranked by relevance
- Click "Reserve" to purchase

#### 6️⃣ **Complete Purchase**
- Review reservation details
- Confirm order
- Track delivery status

---

## 🏗️ Technical Architecture

### Tech Stack

#### **Backend**
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)

#### **Frontend**
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios

#### **AI/ML**
- **Recommendations**: Content-based collaborative filtering
- **Search**: TF-IDF + Fuzzy matching (Levenshtein distance)
- **No External Dependencies**: All algorithms run locally

### Database Schema

```
Hospital
├── id (UUID)
├── name
├── email
├── password (hashed)
├── address
└── country

Product (Canonical Catalog)
├── id (UUID)
├── name
├── gtin (Global Trade Item Number)
├── category
├── description
└── manufacturer

Listing (Marketplace Inventory)
├── id (UUID)
├── hospitalId → Hospital
├── productId → Product
├── quantity
├── pricePerUnit
├── status (draft | available | sold | expired)
└── expiryDate

Reservation (Purchases)
├── id (UUID)
├── listingId → Listing
├── buyerId → Hospital
├── quantity
├── status (pending | confirmed | cancelled)
└── expiresAt (15-minute timeout)
```

---

## 📡 API Documentation

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "info@hospital.com",
  "password": "hospital123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "hospital": {
    "id": "uuid",
    "name": "Hospital Name",
    "email": "info@hospital.com"
  }
}
```

### Dashboard

```http
GET /api/dashboard
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "totalListings": 6,
    "activeListings": 4,
    "draftListings": 2,
    "expiringListings": 0
  }
}
```

### Upload Products

```http
POST /api/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
  file: <Excel/CSV file>

Response:
{
  "success": true,
  "summary": {
    "total": 10,
    "matched": 8,
    "unmatched": 2
  },
  "listings": [...]
}
```

### Get Recommendations

```http
GET /api/recommendations
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "listing-uuid",
      "product": {
        "name": "Surgical Gloves",
        "category": "PPE"
      },
      "pricePerUnit": 0.25,
      "quantity": 500,
      "relevanceScore": 8.5,
      "hospital": {
        "name": "University Hospital"
      }
    }
  ]
}
```

### Search Marketplace

```http
GET /api/search?q=surgical+gloves
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "listing-uuid",
      "product": {
        "name": "Surgical Gloves Sterile",
        "gtin": "7612345678901"
      },
      "pricePerUnit": 0.25,
      "quantity": 500,
      "relevanceScore": 9.2
    }
  ]
}
```

### Create Reservation

```http
POST /api/reservations
Authorization: Bearer <token>
Content-Type: application/json

{
  "listingId": "uuid",
  "quantity": 100
}

Response:
{
  "success": true,
  "data": {
    "id": "reservation-uuid",
    "status": "pending",
    "expiresAt": "2026-02-12T13:45:00Z"
  }
}
```

---

## 🧠 Smart Features

### 1. **Fuzzy Search with Semantic Similarity**

**What it does:** Finds products even if you make typos or use different words.

**How it works:**

```typescript
// User searches: "surgicle glove umbilical"
// System understands:
// 1. "surgicle" → "surgical" (typo correction via Levenshtein distance)
// 2. "glove" → matches "gloves" (partial word matching)
// 3. "umbilical" → finds related products (neonatal category)

// Scoring Algorithm:
queryWords.forEach(word => {
  if (productName.includes(word)) score += 3      // Exact match
  if (manufacturer.includes(word)) score += 2    // Manufacturer match
  if (category.includes(word)) score += 1        // Category match
  if (anyFieldContains(word)) score += 0.5       // Fuzzy match
});

// Bonus for phrase match
if (fullText.includes(entireQuery)) score += 5

// Results sorted by score (highest first)
```

**Example:**
```
Query: "umbilical gloves"

Results:
1. Surgical Gloves Sterile (score: 9.5) ← Exact match
2. Umbilical Cord Clamp (score: 7.0)    ← Contains "umbilical"
3. Nitrile Gloves (score: 3.5)          ← Contains "gloves"
```

### 2. **AI Recommendations (No LLM Required)**

**What it does:** Suggests products you might need based on your behavior.

**Algorithm:**
1. **Analyze Purchase History**: What categories you buy from
2. **Price Pattern Matching**: Products in your typical price range
3. **Category Affinity**: If you buy "Surgical" items, suggest more surgical supplies
4. **Recency Boost**: Prefer newly listed items
5. **Collaborative Signals**: What similar hospitals purchase

**Example:**
```
Your History:
- Bought: Surgical Gloves (PPE category)
- Bought: Face Masks (PPE category)
- Average price paid: 2.50 CHF

Recommendations:
1. Surgical Gowns (PPE, 2.80 CHF) ← Same category, similar price
2. N95 Masks (PPE, 1.50 CHF)      ← Same category, lower price
3. Sterile Drapes (Surgical, 5.00 CHF) ← Related category
```

### 3. **Anti-Oversell Protection**

**Problem:** Two hospitals try to buy the same last 10 units simultaneously.

**Solution:** Database-level locks

```typescript
// Transaction with row-level locking
await prisma.$transaction(async (tx) => {
  // Lock the listing row
  const listing = await tx.listing.findUnique({
    where: { id: listingId }
  });
  
  // Check availability
  if (listing.quantity < requestedQuantity) {
    throw new Error('Insufficient quantity');
  }
  
  // Deduct inventory
  await tx.listing.update({
    where: { id: listingId },
    data: { quantity: listing.quantity - requestedQuantity }
  });
  
  // Create reservation
  await tx.reservation.create({ ... });
});
```

### 4. **Automatic Data Validation**

Upload validation checks:
- ✅ Required fields present (Name, Price, Quantity)
- ✅ Valid GTIN format (13-14 digits)
- ✅ Positive prices and quantities
- ✅ Future expiry dates
- ✅ No duplicate GTINs in same upload
- ✅ Number format validation

**Example Error Messages:**
```
❌ Row 5: Missing required field 'price'
❌ Row 7: Invalid GTIN format (must be 13-14 digits)
❌ Row 12: Expiry date must be in the future
✅ Row 1-4, 6, 8-11, 13-20: Valid
```

---

## 🎨 Application Screenshots

### Dashboard
```
┌──────────────────────────────────────────────────────────┐
│  📊 Dashboard - Inselspital Bern                         │
│                                         [Upload Products]│
├──────────────────────────────────────────────────────────┤
│  [📦 6]      [✅ 4]        [⏳ 2]         [⚠️ 0]        │
│  Total       Active        Under Review  Expiring Soon   │
├──────────────────────────────────────────────────────────┤
│  🎯 Recommended for You                                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Surgical Gloves Sterile Size 7.5       95% match  │  │
│  │ PPE | 05012345600001                               │  │
│  │ 📍 Universitätsspital Zürich                       │  │
│  │ 📦 500 units available            0.25 CHF        │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL=postgresql://marketplace:marketplace123@localhost:5432/p2p_marketplace

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-key-min-32-characters-long

# Server
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Optional: OpenAI API (for future AI features)
# OPENAI_API_KEY=sk-your-key-here
```

---


## 🤝 Contributing

Contributions welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 🙏 Acknowledgments

- Built for hospitals to efficiently trade medical supplies
- AI recommendations powered by content-based filtering
- Semantic search using TF-IDF and fuzzy matching
- No external AI APIs required (100% self-hosted)

---


## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time chat between hospitals
- [ ] Advanced analytics dashboard
- [ ] Integration with hospital ERP systems
- [ ] Multi-language and LLM support

---

**Made with ❤️ for healthcare professionals**
