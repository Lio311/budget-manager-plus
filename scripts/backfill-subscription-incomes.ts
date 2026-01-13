import { PrismaClient } from '@prisma/client'
import { addDays, addMonths, addYears, startOfDay } from 'date-fns'

const prisma = new PrismaClient()

// Copy of the logic from clients.ts but without auth() checks
async function generateIncomesForClient(client: any) {
    if (client.subscriptionStatus !== 'PAID' || !client.subscriptionPrice || !client.subscriptionStart || !client.subscriptionEnd || !client.subscriptionType) {
        return
    }

    try {
        const existingIncomes = await prisma.income.findMany({
            where: {
                clientId: client.id,
                amount: client.subscriptionPrice
            },
            select: { date: true }
        })

        const existingDates = new Set(existingIncomes.map((inc: any) => startOfDay(inc.date).getTime()))

        let currentDate = startOfDay(new Date(client.subscriptionStart))
        const endDate = startOfDay(new Date(client.subscriptionEnd))
        const amount = client.subscriptionPrice
        const currency = '₪'
        const budgetType = 'BUSINESS'

        console.log(`Processing client: ${client.name} - Type: ${client.subscriptionType}`)

        let createdCount = 0

        while (currentDate <= endDate) {
            if (!existingDates.has(currentDate.getTime())) {
                const status = currentDate > new Date() ? 'PENDING' : 'PAID'

                // Create Income directly
                await prisma.budget.upsert({
                    where: {
                        userId_month_year_type: {
                            userId: client.userId,
                            month: currentDate.getMonth() + 1,
                            year: currentDate.getFullYear(),
                            type: 'BUSINESS'
                        }
                    },
                    create: {
                        userId: client.userId,
                        month: currentDate.getMonth() + 1,
                        year: currentDate.getFullYear(),
                        type: 'BUSINESS',
                        currency
                    },
                    update: {}
                }).then(async (budget) => {
                    await prisma.income.create({
                        data: {
                            budgetId: budget.id,
                            source: `מנוי - ${client.name}`,
                            category: 'הכנסות',
                            amount: amount,
                            currency: currency,
                            date: currentDate,
                            isRecurring: false,
                            clientId: client.id,
                            paymentMethod: 'CREDIT_CARD',
                            paymentTerms: 0,
                            paymentDate: status === 'PAID' ? currentDate : undefined,
                            status: status === 'PAID' ? 'PAID' : 'PENDING'
                        }
                    })
                })

                createdCount++
                console.log(`  + Created income for ${currentDate.toISOString().split('T')[0]}`)
            }

            // Advance Date
            switch (client.subscriptionType) {
                case 'WEEKLY':
                    currentDate = addDays(currentDate, 7)
                    break
                case 'MONTHLY':
                    currentDate = addMonths(currentDate, 1)
                    break
                case 'YEARLY':
                    currentDate = addYears(currentDate, 1)
                    break
                case 'PROJECT':
                    currentDate = addDays(endDate, 1) // One time
                    break
                default:
                    currentDate = addDays(endDate, 1) // Break loop
            }
        }

        if (createdCount > 0) {
            console.log(`  => Added ${createdCount} missing income records.`)
        } else {
            console.log(`  => Up to date.`)
        }

    } catch (error) {
        console.error(`Error processing client ${client.name}:`, error)
    }
}

async function main() {
    try {
        console.log('Starting backfill...')
        const clients = await prisma.client.findMany({
            where: {
                subscriptionPrice: { gt: 0 },
                subscriptionStatus: 'PAID'
            }
        })

        console.log(`Found ${clients.length} potential clients.`)

        for (const client of clients) {
            await generateIncomesForClient(client)
        }

        console.log('Done.')
    } catch (error) {
        console.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
