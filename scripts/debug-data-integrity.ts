
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugDataIntegrity() {
    console.log('🚀 Starting Data Integrity Inspection...')

    // 1. Get a user (take the first one or specific email if known)
    const user = await prisma.user.findFirst({
        include: { budgets: true }
    })

    if (!user) {
        console.error('No users found.')
        return
    }

    console.log(`\n👤 User: ${user.email} (${user.id})`)
    console.log(`----------------------------------------`)

    // 2. Analyze Budgets
    const budgets = await prisma.budget.findMany({
        where: { userId: user.id },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        include: {
            _count: {
                select: { incomes: true, expenses: true, bills: true, debts: true, savings: true }
            }
        }
    })

    console.log(`\n📚 Total Budgets: ${budgets.length}`)

    for (const budget of budgets) {
        console.log(`\n📅 ${budget.month}/${budget.year} - [${budget.type}] (ID: ${budget.id})`)
        console.log(`   💰 Incomes:  ${budget._count.incomes}`)
        console.log(`   💸 Expenses: ${budget._count.expenses}`)
        console.log(`   🧾 Bills:    ${budget._count.bills}`)

        // Deep dive into a few items to check categories
        if (budget._count.expenses > 0) {
            // @ts-ignore
            const sampleExpenses = await prisma.expense.findMany({
                where: { budgetId: budget.id },
                take: 3,
                select: { category: true, description: true, amount: true }
            })
            console.log(`   🔍 Sample Expenses: ${sampleExpenses.map(e => `${e.category} (${e.amount})`).join(', ')}`)
        }

        if (budget._count.bills > 0) {
            // @ts-ignore
            const sampleBills = await prisma.bill.findMany({
                where: { budgetId: budget.id },
                take: 3,
                select: { name: true, amount: true }
            })
            console.log(`   🧾 Sample Bills: ${sampleBills.map(b => `${b.name} (${b.amount})`).join(', ')}`)
        }

        if (budget._count.savings > 0) {
            // @ts-ignore
            const sampleSavings = await prisma.saving.findMany({
                where: { budgetId: budget.id },
                take: 3,
                select: { name: true, currentAmount: true }
            })
            console.log(`   🐷 Sample Savings: ${sampleSavings.map(s => `${s.name} (${s.currentAmount})`).join(', ')}`)
        }
    }
}

debugDataIntegrity()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
