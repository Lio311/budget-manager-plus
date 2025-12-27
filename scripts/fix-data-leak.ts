
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixRecurringLeak() {
    console.log('🚀 Starting recurring items audit...')

    const models = [
        { name: 'Income', model: prisma.income },
        { name: 'Expense', model: prisma.expense },
        { name: 'Bill', model: prisma.bill },
        { name: 'Saving', model: prisma.saving }
    ]

    let fixedCount = 0

    for (const { name, model } of models) {
        console.log(`\nChecking ${name}s...`)

        // @ts-ignore
        const children = await model.findMany({
            where: {
                recurringSourceId: { not: null }
            },
            include: {
                budget: true
            }
        })

        console.log(`Found ${children.length} recurring child ${name}s`)

        for (const child of children) {
            if (!child.recurringSourceId) continue

            // @ts-ignore
            const parent = await model.findUnique({
                where: { id: child.recurringSourceId },
                include: { budget: true }
            })

            if (!parent) {
                // Orphaned recurring item (source deleted?)
                continue
            }

            // Check if types match
            if (child.budget.type !== parent.budget.type) {
                console.log(`Mismatch found for ${name} ${child.id}:`)
                console.log(`  Parent Type: ${parent.budget.type} (${parent.budget.month}/${parent.budget.year})`)
                console.log(`  Child Type:  ${child.budget.type} (${child.budget.month}/${child.budget.year})`)
                console.log(`  --> Moving child to ${parent.budget.type}...`)

                // Find/Create correct budget for child
                let targetBudget = await prisma.budget.findUnique({
                    where: {
                        userId_month_year_type: {
                            userId: child.budget.userId,
                            month: child.budget.month,
                            year: child.budget.year,
                            type: parent.budget.type
                        }
                    }
                })

                if (!targetBudget) {
                    console.log(`    Creating new ${parent.budget.type} budget for ${child.budget.month}/${child.budget.year}...`)
                    targetBudget = await prisma.budget.create({
                        data: {
                            userId: child.budget.userId,
                            month: child.budget.month,
                            year: child.budget.year,
                            type: parent.budget.type,
                            // @ts-ignore
                            currency: child.budget.currency
                        }
                    })
                }

                // Update the child item
                // @ts-ignore
                await model.update({
                    where: { id: child.id },
                    data: { budgetId: targetBudget.id }
                })

                fixedCount++
                console.log(`    ✅ Fixed!`)
            }
        }
    }

    console.log(`\n🎉 Scan complete. Fixed ${fixedCount} items.`)
}

fixRecurringLeak()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
