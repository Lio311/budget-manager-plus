export const expiryWarning30Days = (userName: string, expiryDate: string) => `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; text-align: right; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #7c3aed; margin-bottom: 20px;">שלום ${userName},</h2>
    
    <p style="font-size: 16px; line-height: 1.6;">המנוי השנתי שלך ב-Budget Manager Plus יפוג בעוד <strong>30 יום</strong>.</p>
    
    <p style="font-size: 16px;">📅 תאריך תפוגה: <strong>${expiryDate}</strong></p>
    
    <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #ffc107;">
      <p style="margin: 0; font-weight: bold;">⚠️ חשוב לדעת:</p>
      <p style="margin: 10px 0 0 0;">אם לא תחדש את המנוי, כל הנתונים שלך (תקציבים, הכנסות, הוצאות) <strong>יימחקו לצמיתות</strong> 30 יום לאחר תום המנוי.</p>
    </div>
    
    <p style="font-size: 16px;">חדש את המנוי עכשיו ב-<strong>₪50 בלבד</strong> לשנה נוספת.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe" 
         style="display: inline-block; background: #7c3aed; color: white; padding: 15px 40px; 
                text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
        חדש מנוי עכשיו
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
      Budget Manager Plus - ניהול תקציב חכם ופשוט
    </p>
  </div>
</body>
</html>
`

export const expiryWarning7Days = (userName: string, expiryDate: string, deletionDate: string) => `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; text-align: right; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #dc2626; margin-bottom: 20px;">⚠️ התראה אחרונה!</h2>
    
    <p style="font-size: 16px;">שלום ${userName},</p>
    
    <p style="font-size: 18px; font-weight: bold; color: #dc2626;">המנוי שלך יפוג בעוד <strong>7 ימים בלבד</strong>!</p>
    
    <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 25px 0; border: 2px solid #dc2626;">
      <p style="margin: 0; font-size: 18px; font-weight: bold;">🔴 זו ההזדמנות האחרונה שלך!</p>
      <p style="margin: 15px 0 0 0; font-size: 16px;">
        תאריך תפוגה: <strong>${expiryDate}</strong><br>
        מחיקת נתונים: <strong>${deletionDate}</strong>
      </p>
    </div>
    
    <p style="font-size: 16px;">אל תאבד את כל התקציבים, ההכנסות וההוצאות שלך!</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe" 
         style="display: inline-block; background: #dc2626; color: white; padding: 18px 50px; 
                text-decoration: none; border-radius: 8px; font-size: 20px; font-weight: bold;">
        חדש מנוי עכשיו - ₪50
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
      Budget Manager Plus
    </p>
  </div>
</body>
</html>
`

export const accessBlocked = (userName: string, deletionDate: string) => `
<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; text-align: right; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h2 style="color: #dc2626;">המנוי שלך פג</h2>
    
    <p style="font-size: 16px;">שלום ${userName},</p>
    
    <p style="font-size: 16px;">המנוי שלך ב-Budget Manager Plus פג והגישה לדשבורד נחסמה.</p>
    
    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 25px 0; border-right: 4px solid #f59e0b;">
      <p style="margin: 0; font-weight: bold;">הנתונים שלך עדיין שמורים!</p>
      <p style="margin: 10px 0 0 0;">יש לך עד <strong>${deletionDate}</strong> לחדש את המנוי לפני שהנתונים יימחקו לצמיתות.</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe" 
         style="display: inline-block; background: #7c3aed; color: white; padding: 15px 40px; 
                text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">
        חדש מנוי - ₪50
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
      Budget Manager Plus
    </p>
  </div>
</body>
</html>
`
