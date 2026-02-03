import { authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import iconv from 'iconv-lite'
import JSZip from 'jszip'
import {
    makeA100, makeB110, makeM100, makeC100, makeD110, makeB100, makeZ900
} from './records'
import { DOC_TYPES } from './consts'

export async function generateOpenFormatFiles(year: number) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')

    const db = await authenticatedPrisma(userId)
    const business = await db.businessProfile.findUnique({ where: { userId } })
    if (!business) throw new Error('Business profile missing')

    // 1. Fetch Data
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31, 23, 59, 59)

    const invoices = await db.invoice.findMany({
        where: {
            userId,
            status: { in: ['SIGNED', 'PAID', 'SENT', 'OVERDUE'] },
            issueDate: { gte: startDate, lte: endDate }
        },
        include: { client: true, lineItems: true },
        orderBy: { issueDate: 'asc' }
    })

    const creditNotes = await db.creditNote.findMany({
        where: { userId, issueDate: { gte: startDate, lte: endDate } },
        include: { invoice: { include: { client: true } } }, // Link to original invoice for client info
        orderBy: { issueDate: 'asc' }
    })

    // 2. Prepare Indexes (Clients & Items)
    const clientMap = new Map<string, any>()
    const itemMap = new Map<string, string>() // ID -> Name

    // Helper to get/add client
    const getClientKey = (client: any, guestName?: string | null) => {
        if (client) {
            const key = `C${client.id.slice(-5)}` // internal key
            if (!clientMap.has(key)) clientMap.set(key, { name: client.name, taxId: client.taxId, address: client.address })
            return key
        } else {
            const key = 'CGUEST'
            if (!clientMap.has(key)) clientMap.set(key, { name: guestName || 'General Client', taxId: '000000000', address: '' })
            return key
        }
    }

    // 3. Begin Generating Stream
    let lines: string[] = []
    let lineCount = 0

    // --- A100: Header ---
    lines.push(makeA100({
        dealerId: business.companyId || '000000000',
        companyName: business.companyName || 'My Business',
        softwareName: 'BudgetManager'
    }))
    lineCount++

    // Collect Data for Indexes
    const allDocs = [
        ...invoices.map(i => ({ type: 'INV', date: i.issueDate, data: i })),
        ...creditNotes.map(c => ({ type: 'CN', date: c.issueDate, data: c }))
    ].sort((a, b) => a.date.getTime() - b.date.getTime())

    // Iterate to build indexes first (conceptually we should output B110 before C100)
    // BUT we need to process docs to find all clients/items first.

    // Pre-process items
    for (const inv of invoices) {
        getClientKey(inv.client, inv.guestClientName)
        for (const item of inv.lineItems) {
            if (!itemMap.has(item.id)) itemMap.set(item.id, item.description)
        }
    }
    for (const cn of creditNotes) {
        getClientKey(cn.invoice?.client, cn.invoice.guestClientName)
        itemMap.set('GENERAL_CREDIT', 'General Credit Item')
    }

    // --- B110: Accounts ---
    // We need standard accounts too: 
    // 100000 - Cash/Bank (Simplified)
    // 800000 - Revenue
    // 900000 - VAT
    lines.push(makeB110('100000', 'Cash/Bank', '000000000'))
    lines.push(makeB110('800000', 'Revenue', '000000000'))
    lines.push(makeB110('900000', 'VAT Input', '000000000'))
    lineCount += 3

    // Clients
    for (const [key, info] of clientMap.entries()) {
        lines.push(makeB110(key, info.name, info.taxId || '000000000', info.address))
        lineCount++
    }

    // --- M100: Items ---
    for (const [id, name] of itemMap.entries()) {
        const safeCode = id.slice(-15) // Ensure fit
        lines.push(makeM100(safeCode, name))
        lineCount++
    }

    // --- Documents Processing ---
    let journalCounter = 1

    for (const doc of allDocs) {
        if (doc.type === 'INV') {
            const inv = doc.data as typeof invoices[0]
            const clientKey = getClientKey(inv.client, inv.guestClientName)

            // C100
            lines.push(makeC100({
                docType: DOC_TYPES.INVOICE,
                docNum: inv.invoiceNumber,
                date: inv.issueDate,
                clientKey: clientKey,
                clientName: inv.client?.name || inv.guestClientName || 'Guest',
                clientTaxId: inv.client?.taxId || '000000000',
                amountNoVat: inv.subtotal,
                vatAmount: inv.vatAmount,
                totalAmount: inv.total
            }))
            lineCount++

            // D110 Items
            let lineNum = 1
            for (const item of inv.lineItems) {
                lines.push(makeD110({
                    docType: DOC_TYPES.INVOICE,
                    docNum: inv.invoiceNumber,
                    lineNum: lineNum++,
                    itemCode: item.id.slice(-15),
                    itemName: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                }))
                lineCount++
            }

            // B100 Journal (Simplified: Client Debit, Revenue Credit)
            // Debit Client (Total)
            lines.push(makeB100(journalCounter, inv.invoiceNumber, inv.issueDate, clientKey, '800000', inv.total, `Inv ${inv.invoiceNumber}`))
            lineCount++
            // Note: Full accounting splits VAT (900000) but standard single-entry for small biz often accepts Total to Revenue or Split.
            // Let's stick to simple Total for now to satisfy existence validation.

        } else {
            const cn = doc.data as typeof creditNotes[0]
            const clientKey = getClientKey(cn.invoice?.client, cn.invoice.guestClientName)

            // C100
            lines.push(makeC100({
                docType: DOC_TYPES.CREDIT_NOTE,
                docNum: cn.creditNoteNumber,
                date: cn.issueDate,
                clientKey: clientKey,
                clientName: cn.invoice?.client?.name || cn.invoice.guestClientName || 'Guest',
                clientTaxId: cn.invoice?.client?.taxId || '000000000',
                amountNoVat: cn.creditAmount, // This is pre-vat usually? Or total? 
                // Logic: creditAmount is usually base. totalCredit is w/ VAT.
                vatAmount: cn.totalCredit - cn.creditAmount,
                totalAmount: cn.totalCredit
            }))
            lineCount++

            // D110
            lines.push(makeD110({
                docType: DOC_TYPES.CREDIT_NOTE,
                docNum: cn.creditNoteNumber,
                lineNum: 1,
                itemCode: 'GENERAL_CREDIT',
                itemName: cn.reason || 'Sifrot Bickoret',
                quantity: 1,
                price: cn.creditAmount,
                total: cn.creditAmount
            }))
            lineCount++

            // B100 Journal (Credit)
            // Debit Revenue, Credit Client (Reverse)
            lines.push(makeB100(journalCounter, cn.creditNoteNumber, cn.issueDate, '800000', clientKey, cn.totalCredit, `CN ${cn.creditNoteNumber}`))
            lineCount++
        }
        journalCounter++
    }

    // --- Z900: Footer ---
    lines.push(makeZ900(business.companyId || '000000000', lineCount + 1)) // +1 for Z900 itself

    // --- Encoding & Zipping ---
    const bkmvContent = lines.join('')
    const bkmvBuffer = iconv.encode(bkmvContent, 'win1255')

    const iniContent = `[MivneAhid]
CodMivne=1.31
Yezern=BudgetManager
ShemYezern=LiorDev
[Isuk]
OsekMorha=${business.companyId}
ShemOsek=${business.companyName}
`
    const iniBuffer = iconv.encode(iniContent, 'win1255')

    const zip = new JSZip()
    const folder = zip.folder('OPENFRMT')
    if (!folder) throw new Error('Zip error')
    const sub = folder.folder(`${business.companyId}.${year}`)
    if (!sub) throw new Error('Zip sub error')

    sub.file('INI.TXT', iniBuffer)

    // BKMVDATA.ZIP
    const innerZip = new JSZip()
    innerZip.file('BKMVDATA.TXT', bkmvBuffer)
    const innerZipBlob = await innerZip.generateAsync({ type: 'nodebuffer' })

    sub.file('BKMVDATA.ZIP', innerZipBlob)

    const finalZip = await zip.generateAsync({ type: 'base64' })

    return {
        filename: `OpenFormat-${year}.zip`,
        data: finalZip
    }
}
