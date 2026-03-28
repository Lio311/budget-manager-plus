import { authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import iconv from 'iconv-lite'
import JSZip from 'jszip'
import {
    makeA100, makeB110, makeM100, makeC100, makeD110, makeB100, makeZ900, makeA000, makeD120
} from './records'
import { DOC_TYPES } from './consts'
import { generateSummaryReportPDFBuffer } from './summary-report'
import { format } from 'date-fns'

export async function generateOpenFormatFiles(options: { year?: number, startDate?: Date, endDate?: Date }) {
    const { userId } = await auth()
    if (!userId) throw new Error('Unauthorized')
    return generateFilesCore(userId, options)
}

export async function generateFilesCore(userId: string, options: { year?: number, startDate?: Date, endDate?: Date }) {
    const { year } = options;
    console.log(`[OpenFormat] Starting generation for user ${userId}, year ${year}`)
    const db = await authenticatedPrisma(userId)
    const business = await db.businessProfile.findUnique({ where: { userId } })

    if (!business) {
        console.error('[OpenFormat] Business profile missing')
        throw new Error('Business profile missing')
    }
    console.log(`[OpenFormat] Business found: ${business.companyName} (${business.companyId})`)

    // 1. Fetch Data
    let startDate = options.startDate;
    let endDate = options.endDate;
    
    if (!startDate || !endDate) {
        if (!year) throw new Error('Must provide either year or specific date range');
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
    }
    const displayYear = year || startDate.getFullYear();

    console.log(`[OpenFormat] Date range: ${startDate.toISOString()} - ${endDate.toISOString()}`)

    const invoices = await db.invoice.findMany({
        where: {
            userId,
            status: { in: ['SIGNED', 'PAID', 'SENT', 'OVERDUE'] },
            issueDate: { gte: startDate, lte: endDate }
        },
        include: { client: true, lineItems: true },
        orderBy: { issueDate: 'asc' }
    })
    console.log(`[OpenFormat] Found ${invoices.length} invoices`)

    const creditNotes = await db.creditNote.findMany({
        where: { userId, issueDate: { gte: startDate, lte: endDate } },
        include: { invoice: { include: { client: true } } }, // Link to original invoice for client info
        orderBy: { issueDate: 'asc' }
    })
    console.log(`[OpenFormat] Found ${creditNotes.length} credit notes`)

    // --- Record Counters ---
    const counters = {
        A100: 0, B110: 0, B100: 0, C100: 0, D110: 0, D120: 0, M100: 0, Z900: 0, Total: 0
    }
    const addLine = (lineStr: string, type: keyof typeof counters) => {
        lines.push(lineStr)
        counters[type]++
        counters.Total++
    }

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

    // --- A100: Header ---
    addLine(makeA100({
        dealerId: business.companyId || '000000000',
        companyName: business.companyName || 'My Business',
        softwareName: 'BudgetManager'
    }), 'A100')

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
    addLine(makeB110('100000', 'Cash/Bank', '000000000'), 'B110')
    addLine(makeB110('800000', 'Revenue', '000000000'), 'B110')
    addLine(makeB110('900000', 'VAT Input', '000000000'), 'B110')

    for (const [key, info] of clientMap.entries()) {
        addLine(makeB110(key, info.name, info.taxId || '000000000', info.address), 'B110')
    }

    // --- M100: Items ---
    for (const [id, name] of itemMap.entries()) {
        const safeCode = id.slice(-15) // Ensure fit
        addLine(makeM100(safeCode, name), 'M100')
    }

    // --- Documents Processing ---
    let journalCounter = 1
    
    // For Visual Report
    let totalInvCount = 0
    let totalInvTotal = 0
    let totalCnCount = 0
    let totalCnTotal = 0
    let totalRecCount = 0
    let totalRecTotal = 0

    for (const doc of allDocs) {
        if (doc.type === 'INV') {
            const inv = doc.data as typeof invoices[0]
            const clientKey = getClientKey(inv.client, inv.guestClientName)
            
            // Determine DocType code.
            const isReceipt = inv.invoiceType === 'RECEIPT'
            const isInvRec = inv.invoiceType === 'INVOICE_RECEIPT'
            const docTypeCode = isReceipt ? DOC_TYPES.RECEIPT : (isInvRec ? DOC_TYPES.INVOICE_RECEIPT : DOC_TYPES.INVOICE)

            if (isReceipt) { totalRecCount++; totalRecTotal += inv.total; }
            else { totalInvCount++; totalInvTotal += inv.total; }

            // C100
            addLine(makeC100({
                docType: docTypeCode,
                docNum: inv.invoiceNumber,
                date: inv.issueDate,
                clientKey: clientKey,
                clientName: inv.client?.name || inv.guestClientName || 'Guest',
                clientTaxId: inv.client?.taxId || '000000000',
                amountNoVat: inv.subtotal,
                vatAmount: inv.vatAmount,
                totalAmount: inv.total
            }), 'C100')

            // D110 Items (Not for pure receipt according to some systems, but budget-manager attaches items)
            let lineNum = 1
            for (const item of inv.lineItems) {
                addLine(makeD110({
                    docType: docTypeCode,
                    docNum: inv.invoiceNumber,
                    lineNum: lineNum++,
                    itemCode: item.id.slice(-15),
                    itemName: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                }), 'D110')
            }
            
            // D120 Receipt/Payments
            if (isReceipt || isInvRec || inv.paidAmount) {
                // If it's a receipt or paid invoice, document the payment.
                addLine(makeD120({
                    docType: docTypeCode,
                    docNum: inv.invoiceNumber,
                    lineNum: 1, // Payment line
                    paymentMethodCode: '4', // Default Bank Transfer or parse inv.paymentMethod
                    date: inv.paidDate || inv.issueDate,
                    amount: inv.paidAmount || inv.total
                }), 'D120')
                
                if (isInvRec && !isReceipt) {
                    totalRecCount++; totalRecTotal += (inv.paidAmount || inv.total);
                }
            }

            addLine(makeB100(journalCounter++, inv.invoiceNumber, inv.issueDate, clientKey, '800000', inv.total, `Inv ${inv.invoiceNumber}`), 'B100')

        } else {
            const cn = doc.data as typeof creditNotes[0]
            const clientKey = getClientKey(cn.invoice?.client, cn.invoice.guestClientName)
            
            totalCnCount++; totalCnTotal += cn.totalCredit;

            addLine(makeC100({
                docType: DOC_TYPES.CREDIT_NOTE,
                docNum: cn.creditNoteNumber,
                date: cn.issueDate,
                clientKey: clientKey,
                clientName: cn.invoice?.client?.name || cn.invoice.guestClientName || 'Guest',
                clientTaxId: cn.invoice?.client?.taxId || '000000000',
                amountNoVat: cn.creditAmount,
                vatAmount: cn.totalCredit - cn.creditAmount,
                totalAmount: cn.totalCredit
            }), 'C100')

            addLine(makeD110({
                docType: DOC_TYPES.CREDIT_NOTE,
                docNum: cn.creditNoteNumber,
                lineNum: 1,
                itemCode: 'GENERAL_CREDIT',
                itemName: cn.reason || 'Sifrot Bickoret',
                quantity: 1,
                price: cn.creditAmount,
                total: cn.creditAmount
            }), 'D110')

            addLine(makeB100(journalCounter++, cn.creditNoteNumber, cn.issueDate, '800000', clientKey, cn.totalCredit, `CN ${cn.creditNoteNumber}`), 'B100')
        }
    }

    // --- Z900: Footer ---
    addLine(makeZ900(business.companyId || '000000000', counters.Total + 1), 'Z900')

    // --- Encoding & Zipping ---
    const bkmvContent = lines.join('')
    const bkmvBuffer = iconv.encode(bkmvContent, 'win1255')

    const iniContent = makeA000({
        dealerId: business.companyId || '000000000',
        companyName: business.companyName || 'My Business',
        softwareName: 'BudgetManager'
    }, counters.Total, displayYear)

    const iniBuffer = iconv.encode(iniContent, 'win1255')

    // Document Summary Report (PDF)
    const pdfBuffer = await generateSummaryReportPDFBuffer({
        companyName: business.companyName || 'My Business',
        companyId: business.companyId || '000000000',
        startDate: format(startDate, 'dd/MM/yyyy'),
        endDate: format(endDate, 'dd/MM/yyyy'),
        rows: [
            { docTypeCode: '305', docTypeName: 'חשבונית מס / קבלה', quantity: totalInvCount, totalAmount: totalInvTotal },
            { docTypeCode: '400', docTypeName: 'קבלה', quantity: totalRecCount, totalAmount: totalRecTotal },
            { docTypeCode: '330', docTypeName: 'חשבונית זיכוי', quantity: totalCnCount, totalAmount: totalCnTotal },
            { docTypeCode: '200', docTypeName: 'תעודת משלוח (לא פעיל)', quantity: 0, totalAmount: 0 },
            { docTypeCode: '300', docTypeName: 'חשבונית עסקה (לא פעיל)', quantity: 0, totalAmount: 0 }
        ]
    })

    const zip = new JSZip()
    const folder = zip.folder('OPENFRMT')
    if (!folder) throw new Error('Zip error')
    const sub = folder.folder(`${business.companyId}.${displayYear}`)
    if (!sub) throw new Error('Zip sub error')

    sub.file('INI.TXT', iniBuffer)
    sub.file('DOCUMENT_SUMMARY_REPORT.pdf', pdfBuffer)

    // BKMVDATA.ZIP
    const innerZip = new JSZip()
    innerZip.file('BKMVDATA.TXT', bkmvBuffer)
    const innerZipBlob = await innerZip.generateAsync({ type: 'nodebuffer' })

    sub.file('BKMVDATA.ZIP', innerZipBlob)

    const finalZip = await zip.generateAsync({ type: 'base64' })

    return {
        filename: `OpenFormat-${displayYear}.zip`,
        data: finalZip,
        counters,
        stats: {
            totalAmount: totalInvTotal + totalRecTotal,
            invoices: totalInvCount + totalRecCount
        }
    }
}
