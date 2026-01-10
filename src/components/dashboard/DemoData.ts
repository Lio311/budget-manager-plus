export const DEMO_DATA = {
    overview: {
        totalIncome: 12000,
        totalExpenses: 8450,
        balance: 3550,
        monthlyBudget: 10000,
        savings: 45000,
        debts: 25000,
        upcomingBills: 1200
    },
    expenses: [
        {
            id: 'demo-1',
            description: 'קניות בסופר',
            amount: 450,
            category: 'מזון',
            date: new Date().toISOString(),
            paymentMethod: 'כרטיס אשראי'
        },
        {
            id: 'demo-2',
            description: 'דלק',
            amount: 250,
            category: 'רכב',
            date: new Date(Date.now() - 86400000).toISOString(),
            paymentMethod: 'כרטיס אשראי'
        },
        {
            id: 'demo-3',
            description: 'חשבון חשמל',
            amount: 320,
            category: 'חשבונות',
            date: new Date(Date.now() - 172800000).toISOString(),
            paymentMethod: 'הוראת קבע'
        },
        {
            id: 'demo-4',
            description: 'מסעדה',
            amount: 180,
            category: 'בילויים',
            date: new Date().toISOString(),
            paymentMethod: 'מזומן'
        }
    ],
    incomes: [
        {
            id: 'demo-inc-1',
            description: 'משכורת',
            amount: 12000,
            category: 'עבודה',
            date: new Date(new Date().setDate(1)).toISOString(),
            method: 'העברה בנקאית'
        }
    ],
    bills: [
        {
            id: 'demo-bill-1',
            name: 'נטפליקס',
            amount: 45,
            dueDay: 15,
            isPaid: false
        },
        {
            id: 'demo-bill-2',
            name: 'ארנונה',
            amount: 650,
            dueDay: 1,
            isPaid: true
        }
    ],
    savings: [
        {
            id: 'demo-save-1',
            category: 'חיסכון לדירה',
            currentAmount: 45000,
            targetAmount: 200000,
            monthlyDeposit: 1000
        }
    ]
}
