
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log("🔍 Searching for expense 'בופ'...")

    // 1. Search for specific description
    const expenses = await prisma.expense.findMany({
        where: {
            description: {
                contains: 'בופ'
            }
        },
        include: {
            budget: {
                include: {
                    user: true
                }
            }
        }
    })

    if (expenses.length === 0) {
        console.log("❌ No expense found with description 'בופ'")

        // 2. Check latest 5 expenses generally to see what IS there
        console.log("\n📋 Latest 5 expenses in the system:")
        const latest = await prisma.expense.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                budget: {
                    include: { user: true }
                }
            }
        })

        latest.forEach(e => {
            console.log(`- ${e.date.toISOString().split('T')[0]}: ${e.description} (${e.amount} ILS) [User: ${e.budget.user.email}]`)
        })

    } else {
        console.log(`✅ Found ${expenses.length} expenses!`)
        expenses.forEach(e => {
            console.log(`\n--------------------------------`)
            console.log(`ID: ${e.id}`)
            console.log(`Amount: ${e.amount}`)
            console.log(`Description: ${e.description}`)
            console.log(`Date: ${e.date}`)
            console.log(`Created At: ${e.createdAt}`)
            console.log(`User Email: ${e.budget.user.email}`)
            console.log(`User ID: ${e.budget.user.id}`)
            console.log(`Budget ID: ${e.budget.id}`)
            console.log(`--------------------------------`)
        })
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
