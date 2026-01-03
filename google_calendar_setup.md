# מדריך הגדרת חיבור ל-Google Calendar

כדי לאפשר סנכרון עם יומן גוגל, עליך להגדיר פרויקט ב-Google Cloud Console ולקבל מפתחות גישה.

## שלב 1: יצירת פרויקט
1. היכנס ל-[Google Cloud Console](https://console.cloud.google.com/).
2. לחץ על **Create Project** (או בחר פרויקט קיים).
3. תן לפרויקט שם (למשל `Budget Manager`) ולחץ **Create**.

## שלב 2: הפעלת ה-API
1. בתפריט הצד, בחר **APIs & Services** > **Library**.
2. חפש **Google Calendar API**.
3. לחץ על התוצאה ואז לחץ על **Enable**.

## שלב 3: מסך הסכמה (OAuth Consent Screen)
1. בתפריט הצד, בחר **OAuth consent screen**.
2. בחר **External** ולחץ **Create**.
3. מלא את פרטי האפליקציה:
   - **App name**: השם שיופיע למשתמשים (למשל "Budget Manager").
   - **User support email**: האימייל שלך.
   - **Developer contact information**: האימייל שלך.
4. לחץ **Save and Continue** עד שתסיים.

## שלב 4: יצירת מפתחות (Credentials) - זהו החלק החשוב!
1. בתפריט הצד, בחר **Credentials**.
2. לחץ **Create Credentials** ובחר **OAuth client ID**.
3. ב-Application type בחר **Web application**.
4. תחת **Authorized redirect URIs**, לחץ על **Add URI** והדבק את הכתובת הבאה:
   
   ```
   https://your-domain.com/api/auth/google/calendar/callback
   ```
   *(החלף את `your-domain.com` בכתובת האמיתית של האתר שלך ב-Vercel או Render)*
   
   > **שים לב:** אם אתה מריץ מקומית, הוסף גם: 
   > `http://localhost:3000/api/auth/google/calendar/callback`

5. לחץ **Create**.
6. יופיע חלון עם **Client ID** ו-**Client Secret**. העתק אותם.

## שלב 5: הגדרת משתני סביבה (Environment Variables)
הוסף את המשתנים הבאים ב-Vercel/Render (או בקובץ `.env` מקומית):

```env
GOOGLE_CLIENT_ID=העתק_את_הקוד_כאן
GOOGLE_CLIENT_SECRET=העתק_את_הסוד_כאן
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

זהו! כעת סנכרון הלוח יעבוד.
