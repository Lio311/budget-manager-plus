
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const invoices = await prisma.invoice.findMany({
        select: {
            id: true,
            invoiceNumber: true,
            invoiceType: true,
            scope: true
        }
    })

    console.log('Total Invoices:', invoices.length)
    invoices.forEach(inv => {
        console.log(`Invoice #${inv.invoiceNumber}: Type='${inv.invoiceType}', Scope='${inv.scope}'`)
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
