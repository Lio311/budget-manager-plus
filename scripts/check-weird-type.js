
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    const weirdInvoices = await prisma.invoice.findMany({
        where: {
            invoiceType: 'חשבונית (מס, קבלה, עסקה)'
        }
    })

    console.log('Weird Invoices Count:', weirdInvoices.length)
    if (weirdInvoices.length > 0) {
        console.log('Sample:', weirdInvoices[0])
    } else {
        console.log('No invoices found with that type.')
    }
}

main()
