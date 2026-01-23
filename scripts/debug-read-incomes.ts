
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Searching for client Avi Maor...')
    const client = await prisma.client.findFirst({
        where: { name: { contains: 'אבי מאור' } }
    })

    if (!client) {
        console.error('Client not found')
        return
    }

    console.log(`Found client: ${client.name} (${client.id})`)

    const incomes = await prisma.income.findMany({
        where: {
            clientId: client.id
        },
        orderBy: { date: 'desc' }
    })

    console.log(`Found ${incomes.length} TOTAL incomes for this client.`)

    const subIncomes = incomes.filter(i => i.source && i.source.startsWith('מנוי -'))
    console.log(`Found ${subIncomes.length} SUBSCRIPTION incomes (source starts with 'מנוי -').`)

    if (subIncomes.length === 0 && incomes.length > 0) {
        console.log('Sample incomes:', incomes.slice(0, 3))
    } else {
        subIncomes.forEach(i => {
            const dateStr = i.date ? i.date.toISOString() : 'Null Date'
            console.log(`${dateStr} - ${i.amount} - ${i.source} - ${i.status}`)
        })
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect())
