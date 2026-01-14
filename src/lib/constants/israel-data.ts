
export const ISRAELI_CITIES = [
    "תל אביב-יפו", "ירושלים", "חיפה", "ראשון לציון", "פתח תקווה", "אשדוד", "נתניה", "באר שבע", "חולון", "בני ברק",
    "רמת גן", "רחובות", "אשקלון", "בת ים", "בית שמש", "הרצליה", "כפר סבא", "חדרה", "מודיעין-מכבים-רעות", "לוד",
    "רעננה", "רמלה", "נצרת", "מודיעין עילית", "קריית גת", "נהריה", "ביתר עילית", "אום אל-פחם", "עפולה", "אילת",
    "הוד השרון", "עכו", "כרמיאל", "טבריה", "רמת השרון", "נס ציונה", "ראש העין", "אלעד", "קריית אתא", "קריית מוצקין",
    "קריית ביאליק", "קריית ים", "נתיבות", "מעלה אדומים", "יבנה", "דימונה", "צפת", "טמרה", "שפרעם", "סח'נין",
    "יהוד-מונוסון", "באקה אל-גרבייה", "טירה", "קריית מלאכי", "נשר", "קריית אונו", "גבעת שמואל", "טייבה", "מגדל העמק",
    "קריית שמונה", "נשר", "ערד", "טירת כרמל", "כפר יונה", "אריאל", "אור עקיבא", "נתיבות", "מעלות-תרשיחא", "בית שאן", "שדרות"
].sort();

export const ISRAELI_BANKS = [
    { code: "12", name: "בנק הפועלים" },
    { code: "10", name: "בנק לאומי" },
    { code: "11", name: "בנק דיסקונט" },
    { code: "20", name: "בנק מזרחי טפחות" },
    { code: "31", name: "הבנק הבינלאומי" },
    { code: "17", name: "בנק מרכנתיל דיסקונט" },
    { code: "04", name: "בנק יהב" },
    { code: "09", name: "בנק הדואר" },
    { code: "46", name: "בנק מסד" },
    { code: "13", name: "בנק איגוד" },
    { code: "14", name: "בנק אוצר החייל" },
    { code: "54", name: "בנק ירושלים" },
    { code: "26", name: "U-Bank" },
    { code: "68", name: "בנק אוצר השלטון המקומי" },
    { code: "99", name: "בנק ישראל" }
];

export const getBankName = (codeOrName: string | undefined | null) => {
    if (!codeOrName) return '';
    // Try to find by code
    const bankByCode = ISRAELI_BANKS.find(b => b.code === codeOrName);
    if (bankByCode) return `${bankByCode.name} - ${bankByCode.code}`;

    // Try to find by name (if already formatted or just name)
    const bankByName = ISRAELI_BANKS.find(b => b.name === codeOrName);
    if (bankByName) return `${bankByName.name} - ${bankByName.code}`;

    // Return original if no match (maybe it's already "Name - Code" or unknown)
    return codeOrName;
};
