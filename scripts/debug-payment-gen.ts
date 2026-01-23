
import { PrismaClient } from '@prisma/client'
import { generateSubscriptionIncomes } from '../src/lib/actions/clients'

const prisma = new PrismaClient()

async function main() {
    // Find client Avi Maor
    // Using loose search or first client to simplify if ID unknown, but user provided name
    const client = await prisma.client.findFirst({
        where: { name: { contains: 'אבי מאור' } }
    })

    if (!client) {
        console.error('Client "Avi Maor" not found')
        return
    }

    console.log('Found client:', client.name, client.id)
    console.log('Subscription:', {
        status: client.subscriptionStatus,
        start: client.subscriptionStart,
        end: client.subscriptionEnd,
        type: client.subscriptionType,
        price: client.subscriptionPrice
    })

    // Simulate userId (assuming admin or similar, the action needs userId for authenticatedPrisma)
    // We might need to mock authenticatedPrisma or just pass a dummy if the action uses it for connection.
    // The action uses `authenticatedPrisma(userId)`. 
    // In this script we can't easily mock `auth()`, but `generateSubscriptionIncomes` takes `userId`.
    // We need to ensure `authenticatedPrisma` works. It usually checks user validity.
    // For this debug script, I'll assume valid userId is needed.

    // Find a valid user to impersonate
    const user = await prisma.user.findFirst()
    if (!user) {
        console.error('No user found to impersonate')
        return
    }

    console.log('Using user:', user.id)

    // Run generation
    await generateSubscriptionIncomes(client, user.id)

    console.log('Generation complete. Checking incomes...')

    const incomes = await prisma.income.findMany({
        where: {
            clientId: client.id,
            source: { startsWith: 'מנוי -' }
        },
        orderBy: { date: 'asc' }
    })

    console.log(`Found ${incomes.length} incomes:`)
    incomes.forEach(inc => {
        const dateStr = inc.date ? inc.date.toISOString().split('T')[0] : 'No Date'
        console.log(`- ${dateStr}: ${inc.amount} ${inc.currency} (${inc.status})`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
