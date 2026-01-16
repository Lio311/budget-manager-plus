
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: { issueDate: 'desc' },
            take: 5,
            select: {
                invoiceNumber: true,
                invoiceType: true,
                guestClientName: true,
                client: {
                    select: { name: true }
                }
            }
        })

        console.log('Latest 5 Invoices:')
        console.table(invoices)
    } catch (error) {
        console.error(error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
