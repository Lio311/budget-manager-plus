export const DEMO_DATA = {
    overview: {
        totalIncome: 18500, // Logical average salary + side income
        totalExpenses: 14200, // Monthly expenses
        balance: 4300, // Positive balance
        monthlyBudget: 15000,
        savings: 1500, // Reduced to monthly approx amount so balance is positive
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
            paymentMethod: 'כרטיס אשראי'
        },
        {
            id: 'demo-2',
            description: 'תדלוק פז',
            amount: 320,
            category: 'רכב',
            date: new Date(Date.now() - 86400000).toISOString(),
            paymentMethod: 'כרטיס אשראי'
        },
        {
            id: 'demo-3',
            description: 'חשבון חשמל',
            amount: 450,
            category: 'חשבונות',
            date: new Date(Date.now() - 172800000).toISOString(),
            paymentMethod: 'הוראת קבע'
        },
        {
            id: 'demo-4',
            description: 'מסעדה איטלקית',
            amount: 380,
            category: 'בילויים',
            date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            paymentMethod: 'מזומן'
        },
        {
            id: 'demo-5',
            description: 'ביטוח רכב',
            amount: 2800,
            category: 'ביטוח',
            date: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
            paymentMethod: 'כרטיס אשראי'
        }
    ],
    incomes: [
        {
            id: 'demo-inc-1',
            description: 'משכורת הייטק',
            amount: 16000,
            category: 'עבודה',
            date: new Date(new Date().setDate(1)).toISOString(),
            method: 'העברה בנקאית'
        },
        {
            id: 'demo-inc-2',
            description: 'עבודה פרטית',
            amount: 2500,
            category: 'עסק צדדי',
            date: new Date(new Date().setDate(10)).toISOString(),
            method: 'ביט'
        }
    ],
    bills: [
        {
            id: 'demo-bill-1',
            name: 'נטפליקס',
            amount: 55,
            dueDay: 15,
            isPaid: false
        },
        {
            id: 'demo-bill-2',
            name: 'ארנונה',
            amount: 720,
            dueDay: 1,
            isPaid: true
        },
        {
            id: 'demo-bill-3',
            name: 'אינטרנט סיבים',
            amount: 110,
            dueDay: 10,
            isPaid: true
        },
        {
            id: 'demo-bill-4',
            name: 'ספוטיפיי',
            amount: 20,
            dueDay: 20,
            isPaid: false
        }
    ],
    savings: [
        {
            id: 'demo-save-1',
            category: 'חיסכון לדירה',
            currentAmount: 85000,
            targetAmount: 300000,
            monthlyDeposit: 2000
        },
        {
            id: 'demo-save-2',
            category: 'חופשה בחו"ל',
            currentAmount: 12000,
            targetAmount: 20000,
            monthlyDeposit: 1000
        },
        {
            id: 'demo-save-3',
            category: 'קופת חירום',
            currentAmount: 28000,
            targetAmount: 50000,
            monthlyDeposit: 500
        }
    ]
}
