# 💰 Keseflow - Smart Budget Management System

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://budget-manager-plus.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748)](https://www.prisma.io/)
[![Neon](https://img.shields.io/badge/PostgreSQL-Neon-00E599)](https://neon.tech/)

An advanced full-stack web application for intelligent personal and business financial management. Featuring a Hebrew-first interface, real-time optimistic updates, and comprehensive business tools.

---

## ✨ Key Features

### 📱 Enhanced Mobile Experience
- **Responsive Toolbar**: Full access to all tools (Delete All, Import, Settings) on mobile devices.
- **Smart Formatting**: Optimized tables and cards for small screens.
- **Floating Action Buttons**: Quick access to key actions regardless of scroll position.
- **PWA Ready**: Installable as a native app on iOS and Android.

### 🎨 Modern Landing Page
- **Animated Hero Section**: Eye-catching gradient backgrounds with smooth animations.
- **Feature Showcase**: Interactive cards highlighting key capabilities.
- **Pricing Plans**: Clear comparison of Personal vs Business tiers with feature breakdowns.
- **Testimonials & Social Proof**: Build trust with user reviews and statistics.
- **FAQ Section**: Comprehensive answers to common questions.
- **Responsive Design**: Pixel-perfect on all devices from mobile to desktop.
- **Performance Optimized**: Fast loading with Next.js Image optimization and lazy loading.
- **SEO Friendly**: Comprehensive meta tags, Open Graph, and structured data.

### 🏢 Business Financial Suite
- **Dual Mode**: Seamlessly toggle between **Personal** and **Business** budgets per month.
- **Client & Supplier Management**: Comprehensive implementation for tracking business entities.
- **Invoices & Quotes**: 
  - Generate, track, and manage status of financial documents.
  - **Line Items Table**: Detailed itemization with quantity, price, and automatic totals.
  - **Digital Signatures**: Public signing pages for quotes with signature capture.
  - **Native Sharing**: Share invoices and quotes via WhatsApp, email, or any app using native share API.
- **Credit Notes System** (New!):
  - Issue credit notes against existing invoices.
  - Automatic revenue reduction in financial reports.
  - Full or partial credit amounts with VAT calculations.
  - Public viewing pages with business signature.
  - Integrated with Overview tab for accurate revenue tracking.
- **Tax Tracking**: Dynamic VAT handling (Exempt/Full/Partial) and tax-deductible expense recognition.
- **Business Terminology**: Context-aware labels (Revenue vs Income, Costs vs Expenses).

### ⚡ Smart Data Management
- **Excel Import Engine**:
  - Intelligent parsing of bank exports.
  - Automatic categorization based on description/branch matching.
  - Duplicate detection to prevent double-entry.
- **Cascading Categories**:
  - **Live Updates**: Renaming a category automatically updates all historical records.
  - **Smart Deletion**: Deleting a category prompts to remove all associated transactions.
  - **Color Coding**: Visual category differentiation.
- **Bulk Actions**: One-click "Delete All Monthly Expenses" for rapid resets.

### 💸 Personal Financial Management
- **Smart Categorization**: Predefined and custom categories with visual icons.
- **Bills & Subscriptions**: Track monthly commitments with paid/unpaid status toggles.
- **Debt Tracking**: Manage loans and debts with scheduled payments and "paid" markers.
- **Savings Goals**: Set and track progress towards financial targets with specific allocations.

### 🛠️ Advanced Technical Architecture
- **Optimistic UI**: Zero-latency feedback for all CRUD operations (Add, Edit, Delete).
- **Server Actions**: Direct database mutations using React Server Components.
- **Robust Error Handling**: Automatic rollbacks if server operations fail.
- **Security**:
  - Clerk Authentication (Multi-factor, Social Login).
  - Row-level security principles via Prisma middleware.
  - Input validation using Zod.

---

## 🚀 UX & Design
- **Hebrew-First RTL**: Native support for Right-to-Left layouts.
- **Glassmorphism UI**: Modern aesthetic with transparency, blurring, and cohesive color palettes.
- **Micro-animations**: Smooth transitions using Tailwind CSS and Framer Motion concepts.
- **Bento Grid Layout**: Information-dense yet clean dashboard overview.

---

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui (Radix Primitives)
- **Data Fetching**: SWR (Stale-While-Revalidate)
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend & Infrastructure
- **Database**: PostgreSQL (Neon Serverless)
- **ORM**: Prisma (with relational integrity)
- **Auth**: Clerk
- **Hosting**: Vercel (Edge Network)

---

## 📁 Project Structure

```bash
budget-manager-plus/
├── src/
│   ├── app/                        # Next.js App Router (Dashboard, Auth, API)
│   ├── components/
│   │   ├── dashboard/              # Core Dashboard Components
│   │   │   ├── forms/              # Data Entry Forms (Expense, Income, etc.)
│   │   │   ├── tabs/               # Main Tabs (Overview, Expenses, etc.)
│   │   │   └── dialogs/            # Modals (Recurrence, Categories)
│   │   └── ui/                     # Reusable Shadcn Components
│   ├── lib/
│   │   ├── actions/                # Server Actions (Backend Logic)
│   │   └── db.ts                   # Database Connection
│   ├── hooks/                      # Custom Hooks (useOptimisticMutation)
│   └── contexts/                   # Global Contexts (Budget)
├── prisma/                         # Database Schema
└── public/                         # Static Assets
```

---

<div align="center">

**Made with ❤️ | Production Ready**

[Live Demo](https://budget-manager-plus.vercel.app) • [GitHub](https://github.com/Lio311/budget-manager-plus)

</div>
