export const DEMO_DATA = {
    overview: {
        totalIncome: 18500,
        totalExpenses: 14200,
        balance: 4300,
        monthlyBudget: 15000,
        savings: 1500,
        debts: 2000,
        upcomingBills: 2400
    },
    expenses: [
        {
            id: 'demo-1',
            description: 'קניות בסופר (שופרסל)',
            amount: 850,
            category: 'מזון',
            date: new Date().toISOString(),
            paymentMethod: 'CREDIT_CARD',
            currency: 'ILS'
        },
        {
            id: 'demo-2',
            description: 'תדלוק פז',
            amount: 320,
            category: 'רכב',
            date: new Date(Date.now() - 86400000).toISOString(),
            paymentMethod: 'CREDIT_CARD',
            currency: 'ILS'
        },
        {
            id: 'demo-3',
            description: 'חשבון חשמל',
            amount: 450,
            category: 'חשבונות',
            date: new Date(Date.now() - 172800000).toISOString(),
            paymentMethod: 'BANK_TRANSFER',
            currency: 'ILS'
        },
        {
            id: 'demo-4',
            description: 'מסעדה איטלקית',
            amount: 380,
            category: 'בילויים',
            date: new Date(Date.now() - 259200000).toISOString(),
            paymentMethod: 'CASH',
            currency: 'ILS'
        },
        {
            id: 'demo-5',
            description: 'ביטוח רכב',
            amount: 2800,
            category: 'ביטוח',
            date: new Date(Date.now() - 432000000).toISOString(),
            paymentMethod: 'CREDIT_CARD',
            currency: 'ILS'
        },
        {
            id: 'demo-6',
            description: 'נטפליקס',
            amount: 55,
            category: 'מנויים',
            date: new Date(Date.now() - 518400000).toISOString(),
            paymentMethod: 'CREDIT_CARD',
            currency: 'ILS',
            isRecurring: true
        }
    ],
    incomes: [
        {
            id: 'demo-inc-1',
            source: 'משכורת הייטק',
            amount: 16000,
            category: 'משכורת',
            date: new Date(new Date().setDate(1)).toISOString(),
            paymentMethod: 'BANK_TRANSFER',
            currency: 'ILS',
            isRecurring: true
        },
        {
            id: 'demo-inc-2',
            source: 'פרויקט פרילנס',
            amount: 2500,
            category: 'עסק צדדי',
            date: new Date(new Date().setDate(10)).toISOString(),
            paymentMethod: 'BIT',
            currency: 'ILS',
            client: { name: 'לקוח פרטי' }
        },
        {
            id: 'demo-inc-3',
            source: 'החזר מס',
            amount: 1200,
            category: 'החזרים',
            date: new Date(new Date().setDate(15)).toISOString(),
            paymentMethod: 'BANK_TRANSFER',
            currency: 'ILS'
        }
    ],
    bills: [
        {
            id: 'demo-bill-1',
            name: 'נטפליקס',
            amount: 55,
            dueDate: new Date(new Date().setDate(15)).toISOString(),
            isPaid: false,
            currency: 'ILS',
            paymentMethod: 'CREDIT_CARD',
            isRecurring: true
        },
        {
            id: 'demo-bill-2',
            name: 'ארנונה',
            amount: 720,
            dueDate: new Date(new Date().setDate(1)).toISOString(),
            isPaid: true,
            currency: 'ILS',
            paymentMethod: 'CREDIT_CARD',
            isRecurring: true
        },
        {
            id: 'demo-bill-3',
            name: 'אינטרנט סיבים',
            amount: 110,
            dueDate: new Date(new Date().setDate(10)).toISOString(),
            isPaid: true,
            currency: 'ILS',
            paymentMethod: 'CREDIT_CARD',
            isRecurring: true
        },
        {
            id: 'demo-bill-4',
            name: 'ספוטיפיי',
            amount: 20,
            dueDate: new Date(new Date().setDate(20)).toISOString(),
            isPaid: false,
            currency: 'ILS',
            paymentMethod: 'CREDIT_CARD',
            isRecurring: true
        }
    ],
    savings: [
        {
            id: 'demo-save-1',
            name: 'חיסכון לדירה',
            totalAmount: 300000,
            currentAmount: 85000,
            monthlyDeposit: 2000,
            goalDate: new Date(new Date().setFullYear(new Date().getFullYear() + 5)).toISOString(),
            color: '#10B981',
            currency: 'ILS'
        },
        {
            id: 'demo-save-2',
            name: 'חופשה בחו"ל',
            totalAmount: 20000,
            currentAmount: 12000,
            monthlyDeposit: 1000,
            goalDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString(),
            color: '#3B82F6',
            currency: 'ILS'
        },
        {
            id: 'demo-save-3',
            name: 'קופת חירום',
            totalAmount: 50000,
            currentAmount: 28000,
            monthlyDeposit: 500,
            color: '#F59E0B',
            currency: 'ILS'
        }
    ],
    debts: [
        {
            id: 'demo-debt-1',
            creditor: 'בנק הפועלים (הלוואה לרכב)',
            debtType: 'OWED_BY_ME',
            totalAmount: 45000,
            monthlyPayment: 1200,
            dueDay: 10,
            isPaid: true,
            currency: 'ILS',
            paymentMethod: 'BANK_TRANSFER'
        },
        {
            id: 'demo-debt-2',
            creditor: 'יוסי כהן (הלוואה פרטית)',
            debtType: 'OWED_BY_ME',
            totalAmount: 5000,
            monthlyPayment: 500,
            dueDay: 1,
            isPaid: false,
            currency: 'ILS',
            paymentMethod: 'BIT'
        },
        {
            id: 'demo-debt-3',
            creditor: 'דני לוי (חייב לי)',
            debtType: 'OWED_TO_ME',
            totalAmount: 2000,
            monthlyPayment: 200,
            dueDay: 5,
            isPaid: false,
            currency: 'ILS',
            paymentMethod: 'BIT'
        }
    ],
    clients: [
        { id: '1', name: 'טק סולושנס בע"מ', email: 'contact@techsol.co.il', phone: '050-1112222', totalRevenue: 45000 },
        { id: '2', name: 'משרד עו"ד לוי', email: 'office@levylaw.com', phone: '03-9876543', totalRevenue: 12500 },
        { id: '3', name: 'סטארטאפ ניישן', email: 'hello@startup.io', phone: '054-9998888', totalRevenue: 28000 }
    ],
    suppliers: [
        { id: '1', name: 'בזק בינלאומי', category: 'תקשורת', phone: '1800-014-014', email: 'support@bezeqint.co.il' },
        { id: '2', name: 'אופיס דיפו', category: 'ציוד משרדי', phone: '03-1234567', email: 'sales@officedepot.co.il' },
        { id: '3', name: 'AWS', category: 'ענן', email: 'billing@aws.amazon.com' }
    ],
    invoices: [
        { id: '1', invoiceNumber: 'INV-2024-001', clientName: 'טק סולושנס בע"מ', amount: 12000, date: new Date().toISOString(), status: 'PAID', dueDate: new Date().toISOString() },
        { id: '2', invoiceNumber: 'INV-2024-002', clientName: 'משרד עו"ד לוי', amount: 4500, date: new Date(Date.now() - 86400000 * 5).toISOString(), status: 'PENDING', dueDate: new Date(Date.now() + 86400000 * 10).toISOString() },
        { id: '3', invoiceNumber: 'INV-2024-003', clientName: 'סטארטאפ ניישן', amount: 8200, date: new Date(Date.now() - 86400000 * 20).toISOString(), status: 'OVERDUE', dueDate: new Date(Date.now() - 86400000 * 2).toISOString() }
    ],
    quotes: [
        { id: '1', quoteNumber: 'QT-2024-001', clientName: 'לקוח חדש', amount: 5000, date: new Date().toISOString(), status: 'SENT', validUntil: new Date(Date.now() + 86400000 * 14).toISOString() },
        { id: '2', quoteNumber: 'QT-2024-002', clientName: 'טק סולושנס בע"מ', amount: 15000, date: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'ACCEPTED', validUntil: new Date(Date.now() + 86400000 * 7).toISOString() }
    ],
    profitLoss: {
        revenue: 145000,
        expenses: 68000,
        netProfit: 77000,
        monthlyData: [
            { month: 'ינו', revenue: 12000, expenses: 8000 },
            { month: 'פבר', revenue: 15000, expenses: 9500 },
            { month: 'מרץ', revenue: 18000, expenses: 10000 },
            { month: 'אפר', revenue: 14000, expenses: 8500 },
            { month: 'מאי', revenue: 22000, expenses: 12000 },
            { month: 'יוני', revenue: 25000, expenses: 14000 }
        ]
    }
}
