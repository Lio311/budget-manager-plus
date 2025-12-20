# מערכת ניהול תקציב חודשי+ 💰

מערכת מתקדמת לניהול תקציב אישי ומשפחתי עם לוח שנה חכם ותזכורות תשלומים.

## ✨ תכונות מרכזיות

### 📊 Dashboard מקיף
- **סקירה כללית** עם גרפים צבעוניים (Pie Charts, Bar Charts)
- **כרטיסי סיכום** - הכנסות, הוצאות, חיסכון וחובות
- **התקדמות תקציב** - מעקב ויזואלי אחר ניצול התקציב

### 💵 ניהול פיננסי מלא
- **הכנסות** - מעקב אחר כל מקורות ההכנסה
- **הוצאות** - ניהול לפי קטגוריות צבעוניות (מזון, תחבורה, בילויים וכו')
- **חשבונות קבועים** - מעקב אחר חשמל, ארנונה, מנויים
- **חובות** - ניהול הלוואות ותשלומים חודשיים

### 📅 לוח שנה אינטראקטיבי
- **תצוגה חודשית** עם כל התשלומים המתוכננים
- **תזכורות אוטומטיות** - כל חשבון וחוב מופיע בתאריך הרלוונטי
- **אישור תשלום** - סימון V פשוט לאישור שהתשלום בוצע
- **סיכום יומי** - כמה תשלומים מתוכננים בכל יום

### 🌍 תכונות נוספות
- **תמיכה במטבעות** - ₪, $, €, £
- **ממשק בעברית** - RTL מלא
- **Responsive** - מתאים למחשב, טאבלט וטלפון
- **Multi-user** - כל משתמש עם הנתונים שלו (Clerk)

## 🚀 התקנה והרצה

### דרישות מקדימות
- Node.js 18+ 
- npm או yarn
- חשבון Clerk (חינם)
- מסד נתונים PostgreSQL (Neon מומלץ - חינם)

### שלב 1: התקנת Dependencies

```bash
cd budget-manager-plus
npm install
```

### שלב 2: הגדרת משתני סביבה

צור קובץ `.env.local` בשורש הפרויקט:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### קבלת מפתחות Clerk:
1. היכנס ל-https://clerk.com
2. צור Application חדש
3. בחר "Email" כשיטת אימות
4. העתק את המפתחות מ-API Keys

#### קבלת Database URL (Neon):
1. היכנס ל-https://neon.tech
2. צור Project חדש
3. העתק את ה-Connection String
4. הוסף `?sslmode=require` בסוף ה-URL

### שלב 3: הרצת Migrations

```bash
npx prisma generate
npx prisma db push
```

### שלב 4: הרצה מקומית

```bash
npm run dev
```

פתח את הדפדפן ב-http://localhost:3000

## 📦 Deploy ל-Vercel

### שלב 1: Push ל-GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

### שלב 2: Deploy ב-Vercel

1. היכנס ל-https://vercel.com
2. לחץ "Import Project"
3. בחר את ה-Repository מ-GitHub
4. הוסף את משתני הסביבה (Environment Variables):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DATABASE_URL`
5. לחץ "Deploy"

### שלב 3: עדכון Clerk URLs

אחרי ה-Deploy, עדכן ב-Clerk Dashboard:
- **Allowed redirect URLs**: `https://your-app.vercel.app/*`
- **Allowed origins**: `https://your-app.vercel.app`

## 🏗️ מבנה הפרויקט

```
budget-manager-plus/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # דף הבית
│   │   ├── dashboard/         # דשבורד מוגן
│   │   └── api/               # API routes (עתידי)
│   ├── components/
│   │   ├── dashboard/         # קומפוננטות דשבורד
│   │   │   ├── DashboardHeader.tsx
│   │   │   ├── DashboardTabs.tsx
│   │   │   └── tabs/          # כל הטאבים
│   │   └── ui/                # UI components
│   ├── contexts/
│   │   └── BudgetContext.tsx  # Global state
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   └── utils.ts           # Utility functions
│   └── styles/
│       └── globals.css        # Global styles
├── prisma/
│   └── schema.prisma          # Database schema
└── package.json
```

## 🎨 טכנולוגיות

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Clerk
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **State**: React Context + SWR (עתידי)
- **Deployment**: Vercel

## 📝 שימוש

### יצירת תקציב חדש
1. התחבר עם Clerk
2. בחר חודש ושנה בכותרת
3. בחר מטבע (₪/$/ €/£)

### הוספת הכנסות/הוצאות
1. עבור לטאב הרלוונטי
2. מלא את הפרטים בטופס
3. לחץ "הוסף"

### ניהול חשבונות וחובות
1. הוסף חשבון/חוב עם תאריך תשלום
2. הם יופיעו אוטומטית בלוח השנה
3. סמן V כשהתשלום בוצע

### לוח שנה
- כל תשלום מופיע ביום הרלוונטי
- צבע צהוב = חשבון קבוע
- צבע סגול = חוב
- רקע ירוק = כל התשלומים שולמו

## 🔮 תכונות עתידיות

- [ ] API Routes לשמירת נתונים ב-DB
- [ ] SWR לניהול state וcaching
- [ ] ייצוא לExcel/PDF
- [ ] התראות Email/SMS לתשלומים
- [ ] גרפים היסטוריים (השוואת חודשים)
- [ ] תקציב מתוכנן לעומת בפועל
- [ ] קטגוריות מותאמות אישית

## 📄 רישיון

MIT License - חופשי לשימוש אישי ומסחרי

## 💬 תמיכה

יש שאלות? פתח Issue ב-GitHub או צור קשר.

---

**נבנה עם ❤️ בעברית**
