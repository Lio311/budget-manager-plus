
import { PrismaClient } from '@prisma/client'
import { generateOpenFormatFiles } from '../src/lib/open-format/generator'

// Mock auth by overriding or just passing userId if we refactor generator to accept it.
// Since generator uses `auth()`, we can't easily mock it in a script without hacking properties.
// ALTERNATIVE: Refactor generator to accept userId optionally, or fetch it.
// BUT `auth()` is 'use server' / nextjs specific. 

// Better approach for script: Copy the logic OF the generator into the script to test the core parts (DB fetch + logic + Zip) without the `auth()` call.

const prisma = new PrismaClient()

async function main() {
    console.log('Starting Debug...')

    // 1. Find User
    const user = await prisma.user.findFirst({
        where: { email: 'lior@kesefly.com' } // Adjust if needed, or take first user
    })

    if (!user) {
        const anyUser = await prisma.user.findFirst()
        if (!anyUser) throw new Error('No users found')
        console.log('Using fallback user:', anyUser.email)
        return runForUser(anyUser.id)
    }

    console.log('Found user:', user.email, user.id)
    await runForUser(user.id)
}

async function runForUser(userId: string) {
    try {
        console.log('Fetching Business Profile...')
        const business = await prisma.businessProfile.findUnique({ where: { userId } })
        console.log('Business:', business)

        const year = 2026
        const startDate = new Date(year, 0, 1)
        const endDate = new Date(year, 11, 31, 23, 59, 59)

        console.log('Fetching Invoices...')
        const invoices = await prisma.invoice.findMany({
            where: {
                userId,
                status: { in: ['SIGNED', 'PAID', 'SENT', 'OVERDUE'] },
                issueDate: { gte: startDate, lte: endDate }
            },
            include: { client: true, lineItems: true },
            orderBy: { issueDate: 'asc' }
        })
        console.log(`Found ${invoices.length} invoices`)

        const creditNotes = await prisma.creditNote.findMany({
            where: { userId, issueDate: { gte: startDate, lte: endDate } },
            include: { invoice: { include: { client: true } } },
            orderBy: { issueDate: 'asc' }
        })
        console.log(`Found ${creditNotes.length} credit notes`)

        // Attempting Logic from generator.ts
        // We import the helpers if we can, or just mock them to test the flow
        // We will try to dynamically import the actual generator functions if possible, 
        // but since they are not exported as standalone pure functions easily without refactor.

        // Let's rely on the fact that if we got here, DB is fine.
        // Let's verify business.companyId
        if (!business?.companyId) {
            console.error('CRITICAL: Business Company ID is missing!')
        }

        // Test ZIP creation
        const JSZip = require('jszip')
        const zip = new JSZip()
        const folder = zip.folder('OPENFRMT')
        if (!folder) console.error('Failed folder create')

        const subName = `${business?.companyId || 'MISSING'}.${year}`
        console.log('Creating subfolder:', subName)
        const sub = folder.folder(subName)

        console.log('Debug Logic Complete. If no errors here, issue is likely deep in generator.ts specific lines.')

    } catch (e) {
        console.error('DEBUG SCRIPT ERROR:', e)
    }
}

main()
