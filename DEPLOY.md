# הוראות פריסה ל-Vercel (Deployment) 🚀

מכיוון שהחלטנו לדלג על ההגדרות המקומיות, הנה הדרך המהירה ביותר להעלות את האתר לאוויר:

## שלב 1: העלאה ל-GitHub (גיטהאב)

פתח את הטרמינל שלך בתיקייה של הפרויקט והרצת את הפקודות הבאות:

1. צור **Repository חדש** ב-GitHub (אל תוסיף לו README או .gitignore, פשוט צור אותו ריק).
2. העתק את כתובת ה-Repository (נראית כמו `https://github.com/YourUser/budget-plus.git`).
3. הרץ אצלך:

```powershell
git remote add origin <הדבק-כאן-את-הכתובת-שהוצאת>
git branch -M main
git push -u origin main
```

## שלב 2: חיבור ל-Vercel

1. היכנס ל-[Vercel Dashboard](https://vercel.com/dashboard).
2. לחץ על **Add New...** -> **Project**.
3. בחר את ה-Repository שיצרת הרגע (תצטרך אולי לאשר גישה ל-GitHub אם זו פעם ראשונה).
4. לחץ על **Import**.

## שלב 3: הגדרת משתני סביבה (Environment Variables)

לפני שאתה לוחץ "Deploy", פתח את הלשונית **Environment Variables** והוסף את שלושת המשתנים הבאים:

| שם המשתנה (Key) | ערך (Value) | הערות |
|-------------------|---|---|
| `DATABASE_URL` | הכתובת מ-Neon | *חשוב:* השתמש בכתובת **Pooled** (עם 6543) ב-Vercel זה בסדר! |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | המפתח מ-Clerk | מתחיל ב-`pk_test_` |
| `CLERK_SECRET_KEY` | המפתח הסודי מ-Clerk | מתחיל ב-`sk_test_` |

**טיפ:** הוסף גם משתנה בשם `NEXT_PUBLIC_APP_URL` עם הערך של הדומיין שתקבל מ-Vercel (אחרי ה-Deploy הראשון תקבל אותו, תוכל לעדכן אחר כך).

5. לחץ על **Deploy**.

## שלב 4: עדכון סכמת ה-DB (החשוב ביותר!)

מכיוון שלא הרצנו `db push` מקומית, Vercel יבנה את האתר אבל ה-Database יהיה ריק (ללא טבלאות). כדי לתקן את זה, ננצל את Vercel:

1. ב-Project Settings ב-Vercel, לך ל-**Build & Development Settings**.
2. שנה את **Build Command** ל:
   ```bash
   npx prisma generate && npx prisma db push && next build
   ```
   *(זה יגרום לכך שכל פעם שאתה מעלה גרסה, Vercel יעדכן את הטבלאות ב-Neon אוטומטית)*.

3. לך ל-Deployments -> לחץ על ה-3 נקודות (...) ליד ה-Deployment האחרון -> **Redeploy**.

זהו! האתר יהיה באוויר והמסד נתונים יתעדכן. ✨
