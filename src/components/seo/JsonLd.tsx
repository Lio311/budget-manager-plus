export function WebApplicationJsonLd() {
    const baseUrl = 'https://www.kesefly.co.il'

    // Organization Schema
    const organizationSchema = {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'Kesefly',
        url: baseUrl,
        logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`, // Assuming logo exists, or use a default one
            width: 512,
            height: 512
        },
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'support@kesefly.co.il'
        }
    }

    // WebSite Schema
    const websiteSchema = {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'Kesefly',
        description: 'מערכת ניהול תקציב חכמה לעסקים ומשפחות',
        publisher: {
            '@id': `${baseUrl}/#organization`
        },
        inLanguage: 'he-IL'
    }

    // WebPage Schema (Homepage)
    const webpageSchema = {
        '@type': 'WebPage',
        '@id': `${baseUrl}/#webpage`,
        url: baseUrl,
        name: 'Kesefly - ניהול תקציב לעסקים ומשפחות',
        isPartOf: {
            '@id': `${baseUrl}/#website`
        },
        about: {
            '@id': `${baseUrl}/#organization`
        },
        description: 'הפלטפורמה המתקדמת בישראל לניהול תזרים מזומנים, הוצאות, הכנסות ותקציב - לעסקים ולמשפחות.',
        inLanguage: 'he-IL'
    }

    // SoftwareApplication Schema
    const applicationSchema = {
        '@type': 'SoftwareApplication',
        name: 'Kesefly',
        description: 'מערכת ניהול תקציב חכמה לניהול הכנסות, הוצאות, חשבונות וחיסכונות',
        url: baseUrl,
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
        author: {
            '@id': `${baseUrl}/#organization`
        }
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            organizationSchema,
            websiteSchema,
            webpageSchema,
            applicationSchema
        ]
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}
