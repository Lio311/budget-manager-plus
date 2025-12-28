# 💰 Keseflow - Smart Budget Management System

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://budget-manager-plus.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)](https://www.prisma.io/)

An advanced full-stack web application for intelligent personal and business financial management. Featuring a Hebrew-first interface, real-time optimistic updates, and comprehensive business tools.

---

## ✨ Key Features

### 🏢 Business Financial Suite (New!)
- **Client & Supplier Management**: Comprehensive database for tracking business relationships
- **Invoices & Quotes Engine**: Generate and manage professional documents with status tracking
- **Dynamic VAT Handling**: Automatic VAT calculations (18% standard/exempt) for revenue and expenses
- **Business-First View**: Optimized terminology (Revenue/Sales, Costs) for business budget modes

### 💸 Personal Financial Management
- **Smart Categorization**: Predefined and custom categories with visual icons
- **Bills & Subscriptions**: Track monthly commitments with paid/unpaid status toggles
- **Debt Tracking**: Manage loans and debts with scheduled payments
- **Savings Goals**: Set and track progress towards financial targets

### ⚡ Optimistic UI Infrastructure
- **Zero-Latency Feedback**: Instant UI updates for Add, Delete, and Toggle operations
- **Automatic Rollback**: Built-in error handling that restores state on server failure
- **Custom SWR Hooks**: Specialized infrastructure (`useOptimisticMutation`) for high-performance state management
- **Silent Toggles**: Smooth status changes without intrusive loading states

### 📊 Intelligence & Visualization
- **Dynamic Dashboard**: Responsive overview of income, expenses, and current balance
- **Advanced Charts**: Visual breakdown of spending habits using Recharts
- **Interactive Calendar**: Full-screen calendar view for monthly transaction tracking
- **Multi-Currency Support**: Track financials in ILS, USD, EUR, and GBP

---

## 🚀 Experience & UX

- **Hebrew-First RTL**: Native support for Right-to-Left layouts with professional Hebrew localization
- **PWA Support**: Install Keseflow as a native app on iOS and Android
- **Performance Optimized**: 
  - Async data loading with **Skeleton Loaders**
  - Static content hydration for instant perceived performance
  - Automatic bundle splitting and image optimization
- **Premium Aesthetics**: Vibrant design system with Glassmorphism elements and smooth micro-animations

---

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **State & Data**: SWR (Stale-While-Revalidate) with custom optimistic hooks
- **Styling**: Tailwind CSS with Radix UI Primitives
- **Notifications**: Sonner (Toasts)
- **Authenticaton**: Clerk (he-IL localized)

### Backend & DevOps
- **Database**: PostgreSQL (Neon Serverless) with Prisma ORM
- **SEO**: Dynamic JSON-LD, Sitemap generation, and Open Graph optimization
- **API**: Type-safe Server Actions with Zod validation
- **Deployment**: Vercel (CI/CD integrated)

---

## 📦 Quick Start

1. **Clone & Install**
   ```bash
   git clone https://github.com/Lio311/budget-manager-plus.git
   npm install
   ```

2. **Environment Variables**
   Set up your `.env` with Clerk keys and Neon database URL.

3. **Database Setup**
   ```bash
   npx prisma db push
   ```

4. **Run**
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```
budget-manager-plus/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── page.tsx               # Landing page
│   │   ├── layout.tsx             # Root layout with Clerk
│   │   └── dashboard/             # Dashboard pages
│   ├── components/
│   │   ├── ui/                    # Reusable UI components (Radix UI)
│   │   └── dashboard/             # Dashboard-specific components
│   │       ├── DashboardHeader.tsx
│   │       ├── DashboardTabs.tsx
│   │       └── tabs/              # Tab components
│   │           ├── OverviewTab.tsx
│   │           ├── IncomeTab.tsx
│   │           ├── ExpensesTab.tsx
│   │           ├── BillsTab.tsx
│   │           └── DebtsTab.tsx
│   ├── lib/
│   │   ├── actions/               # Server Actions
│   │   │   ├── income.ts
│   │   │   ├── expense.ts
│   │   │   ├── bill.ts
│   │   │   └── debts.ts
│   │   └── utils.ts               # Utility functions
│   ├── contexts/
│   │   └── BudgetContext.tsx      # Global state management
│   └── middleware.ts              # Clerk authentication middleware
├── prisma/
│   └── schema.prisma              # Database schema
├── public/
│   └── keseflow.png               # Logo and assets
└── package.json
```

---

## 📈 Search Engine Optimization (SEO)
The application includes a comprehensive SEO suite:
- **JSON-LD**: Structured data for better Google search results
- **Meta Tags**: Optimized Open Graph and Twitter card integration
- **Sitemap & Robots**: Automatically generated for efficient crawling
- **PWA Manifest**: Full progressive web app configuration

---

## 🔄 Version History

### v3.0 - December 2024 (Current)
- 🏢 **Business Mode**: Added full support for Client/Supplier management and Invoices/Quotes
- ⚡ **Full Optimistic UI**: Rewrote the interaction layer for instant feedback across all modules
- 📦 **PWA & Mobile**: Implemented PWA support and optimized touch interactions
- 🔍 **SEO Suite**: Completed comprehensive SEO and performance optimizations

### v2.0 - November 2024
- 🔄 **Recurring Transactions**: Support for long-term financial planning
- ✏️ **Inline Editing**: Real-time editing of all transaction types
- 🎨 **Design Refresh**: Transitioned to the new "Keseflow" branding

---

<div align="center">

**Made with ❤️ | Production Ready**

[Live Demo](https://budget-manager-plus.vercel.app) • [GitHub](https://github.com/Lio311/budget-manager-plus)

</div>
