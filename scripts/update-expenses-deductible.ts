import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateExpenses() {
    try {
        // Update all expenses where isDeductible is null to true
        const result = await prisma.expense.updateMany({
            where: {
                isDeductible: null
            },
            data: {
                isDeductible: true
            }
        })

        console.log(`Updated ${result.count} expenses to isDeductible: true`)
    } catch (error) {
        console.error('Error updating expenses:', error)
    } finally {
        await prisma.$disconnect()
    }
}

updateExpenses()
