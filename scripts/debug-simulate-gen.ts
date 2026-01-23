
import { PrismaClient } from '@prisma/client'
import { startOfDay, addMonths, addDays, addYears } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log('Finding client Avi Maor...')
    const client = await prisma.client.findFirst({
        where: { name: { contains: 'אבי מאור' } }
    })

    if (!client) {
        console.error('Client not found')
        return
    }

    console.log('Client found:', client.id)
    console.log('Subscription Data:', {
        status: client.subscriptionStatus,
        price: client.subscriptionPrice,
        start: client.subscriptionStart,
        end: client.subscriptionEnd,
        type: client.subscriptionType
    })

    // 1. Validation Check
    if (!client.subscriptionStatus || !client.subscriptionPrice || !client.subscriptionStart || !client.subscriptionEnd || !client.subscriptionType) {
        console.error('VALIDATION FAILED: Missing required fields')
        if (!client.subscriptionStatus) console.log('Missing: status')
        if (!client.subscriptionPrice) console.log('Missing: price')
        if (!client.subscriptionStart) console.log('Missing: start')
        if (!client.subscriptionEnd) console.log('Missing: end')
        if (!client.subscriptionType) console.log('Missing: type')
        return
    }

    console.log('Validation passed.')

    // 2. Date Setup
    let currentDate = startOfDay(new Date(client.subscriptionStart))
    const endDate = startOfDay(new Date(client.subscriptionEnd))

    console.log(`Loop: ${currentDate.toISOString()} to ${endDate.toISOString()}`)

    if (currentDate > endDate) {
        console.error('ERROR: Start date is after End date')
        return
    }

    // 3. Existing Check
    const existingIncomes = await prisma.income.findMany({
        where: {
            clientId: client.id,
            source: { startsWith: 'מנוי -' }
        },
        select: { date: true }
    })
    console.log(`Found ${existingIncomes.length} existing incomes.`)
    const existingDates = new Set(existingIncomes
        .filter(inc => inc.date)
        .map((inc) => startOfDay(inc.date!).getTime())
    )

    // 4. Loop Simulation
    let iterations = 0
    while (currentDate <= endDate) {
        iterations++
        if (iterations > 50) {
            console.log('Loop safety break')
            break
        }

        if (existingDates.has(currentDate.getTime())) {
            console.log(`Skipping ${currentDate.toISOString()} - exists`)
        } else {
            console.log(`WOULD CREATE INCOME for ${currentDate.toISOString()}`)
        }

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
            default:
                console.log(`Unknown type: ${client.subscriptionType}`)
                currentDate = addDays(endDate, 1) // Force break
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())
