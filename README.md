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

### 📤 **Smart Upload System**
Upload your inventory effortlessly:
- **Excel/CSV Support**: Upload files with your product data
- **Automatic Validation**: System checks for errors (missing prices, invalid dates, duplicates)
- **Review Before Publishing**: All uploads go to "Under Review" status first
- **Bulk Processing**: Upload hundreds of products at once

### 🔍 **Intelligent Search**
Find products using advanced search:
- **Fuzzy Matching**: Find "surgicle gloves" even if you type "surgical glove" (handles typos)
- **Semantic Search**: Understands context (searching "umbilical" shows neonatal supplies)
- **Smart Ranking**: Most relevant results appear first
- **Filter & Sort**: Narrow down by category, price, quantity

### 🤖 **AI-Powered Recommendations**
Get personalized suggestions:
- **Purchase History Analysis**: Recommends products similar to what you've bought
- **Behavioral Patterns**: Learns from your browsing habits
- **Category Matching**: Suggests products in categories you frequently purchase
- **No External APIs**: All AI runs locally (100% free, no data leaves your server)

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
