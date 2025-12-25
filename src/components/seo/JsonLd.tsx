export function WebApplicationJsonLd() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Keseflow',
        description: 'מערכת ניהול תקציב חכמה לניהול הכנסות, הוצאות, חשבונות וחיסכונות',
        url: 'https://keseflow.vercel.app',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        inLanguage: 'he',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'ILS',
        },
        featureList: [
            'ניהול הכנסות והוצאות',
            'מעקב אחר חשבונות קבועים',
            'ניהול חובות וחיסכונות',
            'לוח שנה פיננסי אינטראקטיבי',
            'תזכורות תשלומים',
            'ניתוח פיננסי מתקדם'
        ],
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}
