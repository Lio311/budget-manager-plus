# 💰 Keseflow - Smart Budget Management System

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://budget-manager-plus.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)](https://www.prisma.io/)


An advanced full-stack web application for intelligent personal and family budget management with Hebrew-first interface, real-time tracking, and smart automation features.

![Keseflow Banner](public/keseflow.png)

---

## ✨ Key Features

### 💸 Multi-Category Financial Tracking
- **Income Management**: Track multiple income sources with date-based organization
- **Smart Categorization**: 8 predefined expense categories (Food, Transportation, Housing, etc.)
- **Bills & Subscriptions**: Automated tracking of recurring monthly payments
- **Debt Management**: Comprehensive debt tracking with payment schedules

### 🔄 Recurring Transactions Engine
- **Smart Automation**: Define start and end dates for recurring income/expenses
- **Automatic Generation**: System creates future instances across date range
- **Flexible Control**: Cancel recurring series from any future month
- **Database Optimization**: Linked instances via `recurringSourceId` for efficient queries

### ✏️ Inline Editing System
- **Universal Edit Mode**: Pencil icon triggers inline editing across all transaction types
- **Real-time Validation**: Client-side validation with server-side verification
- **Optimistic UI**: Instant feedback with rollback on error
- **Toast Notifications**: 1-second duration for all user actions

### 📊 Advanced Dashboard
- **Monthly Overview**: Visual summary of income, expenses, and balance
- **Category Breakdown**: Pie charts and statistics for spending analysis
- **Calendar Integration**: Monthly view with due date tracking
- **Payment Status**: Visual distinction between paid and unpaid items

### 🎨 User Experience
- **Hebrew-First Interface**: Full RTL support with Hebrew localization
- **Responsive Design**: Mobile-first approach with hamburger navigation
- **Beautiful UI**: Tailwind CSS with custom design system
- **Date Picker**: Intuitive calendar component for date selection
- **Loading States**: Skeleton screens and spinners for better UX

---

## 🚀 Quick Start

### Live Demo
Visit our live application: [Keseflow on Vercel](https://budget-manager-plus.vercel.app)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Lio311/budget-manager-plus.git
   cd budget-manager-plus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="your-postgresql-connection-string"
   
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
   CLERK_SECRET_KEY="your-clerk-secret-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:3000`

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

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4
- **UI Components**: Radix UI (Dialog, Popover, Select, etc.)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js with Next.js Server Actions
- **ORM**: Prisma 5.0
- **Database**: PostgreSQL (Neon serverless)
- **Authentication**: Clerk with Hebrew localization
- **API**: Type-safe Server Actions with Zod validation

### DevOps & Deployment
- **Hosting**: Vercel (Edge Network)
- **Database**: Neon PostgreSQL (serverless, auto-scaling)
- **CI/CD**: Automatic deployment on Git push
- **Version Control**: Git & GitHub
- **SSL**: Automatic HTTPS via Vercel

---

## 📊 Database Schema

### Core Models

```prisma
model User {
  id        String   @id
  email     String   @unique
  budgets   Budget[]
}

model Budget {
  id        String    @id @default(cuid())
  userId    String
  month     Int
  year      Int
  incomes   Income[]
  expenses  Expense[]
  bills     Bill[]
  debts     Debt[]
}

model Income {
  id                  String    @id @default(cuid())
  source              String
  amount              Float
  date                DateTime?
  isRecurring         Boolean   @default(false)
  recurringSourceId   String?
  recurringStartDate  DateTime?
  recurringEndDate    DateTime?
}

model Expense {
  id                  String    @id @default(cuid())
  category            String
  description         String
  amount              Float
  date                DateTime
  isRecurring         Boolean   @default(false)
  recurringSourceId   String?
  recurringStartDate  DateTime?
  recurringEndDate    DateTime?
}
```

---

## 🎯 Core Features Deep Dive

### Recurring Transactions
The system supports automatic creation of recurring transactions:

```typescript
// Example: Create recurring income for 12 months
await addIncome(month, year, {
  source: "Monthly Salary",
  amount: 10000,
  date: "2024-01-01",
  isRecurring: true,
  recurringStartDate: "2024-01-01",
  recurringEndDate: "2024-12-31"
});
// Creates 12 income entries automatically
```

### Inline Editing
All transaction types support inline editing:
- Click pencil icon → fields become editable
- Modify values → click ✓ to save or ✗ to cancel
- Optimistic UI updates with server validation
- Toast notifications for user feedback

### Smart Calendar
- Monthly navigation with visual indicators
- Automatic bill due date tracking
- Payment status visualization
- Category-based filtering

---

## 🚢 Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Connect your GitHub repository
   - Add environment variables:
     - `DATABASE_URL`
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
   - Deploy automatically

3. **Database Setup**
   - Create Neon PostgreSQL database
   - Run migrations via Vercel CLI or dashboard

### Custom Domain Setup
See [Domain Setup Guide](docs/domain_setup.md) for detailed instructions on connecting a custom domain.

---

## 📈 Performance Metrics

### Application Performance
- **Initial Load**: < 2 seconds (Vercel Edge Network)
- **Time to Interactive**: < 1 second
- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices)
- **Bundle Size**: Optimized with Next.js automatic code splitting

### User Experience
- **Toast Duration**: 1 second (optimized for quick feedback)
- **Edit Mode**: Inline editing with zero page reloads
- **Mobile Responsive**: 100% mobile-optimized interface
- **RTL Support**: Full Hebrew language support

---

## 🔐 Security & Authentication

### Clerk Integration
- Production-ready authentication system
- Custom branding with Keseflow logo
- Hebrew localization (heIL)
- Secure session management
- Social login support (Google, etc.)

### Data Security
- Server-side validation for all mutations
- Type-safe API with TypeScript
- SQL injection prevention via Prisma
- HTTPS enforced on all connections

---

## 🎨 UI/UX Highlights

### Design System
- **Colors**: Green-based palette for financial theme
- **Typography**: System fonts with Hebrew support
- **Components**: Consistent Radix UI primitives
- **Animations**: Smooth transitions and loading states

### Responsive Breakpoints
- **Mobile**: < 768px (Hamburger menu)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px (Full sidebar)

---

## 📝 API Examples

### Server Actions

```typescript
// Add income
const result = await addIncome(month, year, {
  source: "Freelance Work",
  amount: 5000,
  date: "2024-01-15"
});

// Update expense
const result = await updateExpense(expenseId, {
  category: "Food",
  description: "Groceries",
  amount: 250,
  date: "2024-01-10"
});

// Delete bill
const result = await deleteBill(billId);
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📚 Documentation

- [Domain Setup Guide](docs/domain_setup.md)
- [Namecheap DNS Configuration](docs/namecheap_dns_setup.md)
- [Clerk Production Mode](docs/clerk_production_mode.md)
- [Project Description](docs/project_description.md)

---

## 🙏 Acknowledgments

- **Framework**: Next.js by Vercel
- **UI Components**: Radix UI
- **Authentication**: Clerk
- **Database**: Neon PostgreSQL
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

---

## 📧 Contact

For questions, suggestions, or issues, please open an issue on GitHub or contact via email.

---

## 🔄 Version History

### v2.0 - December 2024
- 🔄 **Recurring Transactions**: Full support for recurring income/expenses
- ✏️ **Inline Editing**: Edit all transaction types inline
- 🎨 **UI Refresh**: New Keseflow branding and logo
- 📱 **Mobile Optimization**: Improved responsive design
- ⚡ **Performance**: Optimistic UI updates
- 🌐 **RTL Support**: Enhanced Hebrew interface

### v1.0 - November 2024
- 🎯 Initial release with core features
- 💰 Income and expense tracking
- 📊 Basic dashboard and charts
- 🔐 Clerk authentication
- 📱 Responsive design

---

<div align="center">

**Made with ❤️ using Next.js, TypeScript, and Prisma**

**Current Version: 2.0 | Production Ready**

[Live Demo](https://budget-manager-plus.vercel.app) • [GitHub](https://github.com/Lio311/budget-manager-plus)

</div>
