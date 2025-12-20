# הוראות התקנה מהירות

## שלב 1: התקנת Dependencies

```powershell
cd C:\Users\Lior\.gemini\antigravity\scratch\budget-manager-plus
npm install
```

⏱️ זמן משוער: 2-3 דקות

---

## שלב 2: הגדרת Clerk (Authentication)

### 2.1 יצירת חשבון
1. לך ל-https://clerk.com
2. לחץ "Sign Up" (חינם לחלוטין)
3. אשר את המייל

### 2.2 יצירת Application
1. לחץ "+ Create Application"
2. שם: "Budget Manager Plus"
3. בחר "Email" בלבד
4. לחץ "Create Application"

### 2.3 העתקת מפתחות
1. ב-Dashboard, לך ל-"API Keys"
2. העתק:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (מתחיל ב-`pk_test_`)
   - `CLERK_SECRET_KEY` (מתחיל ב-`sk_test_`)

### 2.4 יצירת קובץ .env.local

צור קובץ חדש בשורש הפרויקט:
```
C:\Users\Lior\.gemini\antigravity\scratch\budget-manager-plus\.env.local
```

הדבק את המפתחות:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## שלב 3: הגדרת Database (Neon PostgreSQL)

### 3.1 יצירת חשבון
1. לך ל-https://neon.tech
2. לחץ "Sign Up" (חינם - 0.5GB)
3. התחבר עם GitHub/Google

### 3.2 יצירת Project
1. לחץ "Create a project"
2. שם: "budget-manager-db"
3. Region: בחר הכי קרוב (Europe)
4. לחץ "Create Project"

### 3.3 העתקת Connection String
1. אחרי יצירת הפרויקט, תראה "Connection String"
2. בחר "Prisma" מהתפריט
3. העתק את כל ה-URL
4. הדבק ב-`.env.local` תחת `DATABASE_URL`

**חשוב:** ודא שיש `?sslmode=require` בסוף ה-URL!

---

## שלב 4: הרצת Prisma

```powershell
npx prisma generate
npx prisma db push
```

זה יוצר את כל הטבלאות במסד הנתונים.

---

## שלב 5: הרצה!

```powershell
npm run dev
```

פתח דפדפן: **http://localhost:3000**

---

## בעיות נפוצות

### ❌ "npx cannot be loaded"
**פתרון:**
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### ❌ "Prisma Client did not initialize"
**פתרון:**
```powershell
npx prisma generate
```

### ❌ "Clerk keys not found"
**פתרון:** ודא שהקובץ `.env.local` נמצא בשורש הפרויקט (לא בתיקיית src)

### ❌ "Database connection failed"
**פתרון:** ודא שה-DATABASE_URL נכון ויש `?sslmode=require` בסוף

---

## מה הלאה?

אחרי שהכל עובד:
1. צור משתמש חדש (Sign Up)
2. התחבר (Sign In)
3. נווט בין הטאבים
4. הוסף הכנסות/הוצאות/חשבונות
5. בדוק את לוח השנה

---

## Deploy ל-Production

ראה את [README.md](./README.md) להוראות deploy ל-Vercel.

---

**זקוק לעזרה?** פתח Issue ב-GitHub או צור קשר.
