
const { PrismaClient } = require('@prisma/client')

// Mock removed


// Actually, mocking auth in a script is hard.
// I'll just use the prisma client directly to simulate the query exactly as written in getInvoices
// to see if the query structure is correct.

const prisma = new PrismaClient()

async function main() {
    // 1. Get a userId from the latest invoice
    const latestInvoice = await prisma.invoice.findFirst({
        orderBy: { issueDate: 'desc' }
    })

    if (!latestInvoice) {
        console.log('No invoices found')
        return
    }

    const userId = latestInvoice.userId
    console.log('Testing with userId:', userId)

    // 2. Run the exact query from getInvoices
    const invoices = await prisma.invoice.findMany({
        where: {
            userId,
            scope: 'BUSINESS'
        },
        include: {
            client: true,
            lineItems: true,
            incomes: true
        },
        orderBy: {
            issueDate: 'desc'
        },
        take: 5
    })

    console.log('Query Results:')
    invoices.forEach(inv => {
        console.log(`Invoice ${inv.invoiceNumber}: Type=${inv.invoiceType}`)
    })
}

main()
