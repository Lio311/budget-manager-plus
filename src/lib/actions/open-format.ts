'use server'

import { authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import JSZip from 'jszip'
import iconv from 'iconv-lite'
import { format } from 'date-fns'

/* 
  Mivne Achid 1.31 Specs (Simplified for implementation context)
  Encoding: Windows-1255
  New Line: CR+LF
  
  Files:
  INI.TXT - Metadata
  BKMVDATA.TXT - Main data file content (zipped)
*/

// --- Helper Utilities ---

function formatString(str: string | null | undefined, length: number): string {
    const s = str ? str.trim() : ''
    // If string is longer, truncate. If shorter, pad RIGHT with spaces
    // Note: In Windows-1255 (Hebrew), visual alignment might look weird in editors but logical is what matters.
    // Mivne Achid: Text fields are Left Aligned (Pad Right)
    return s.slice(0, length).padEnd(length, ' ')
}

function formatNumber(num: number | null | undefined, length: number): string {
    if (num === null || num === undefined) return '0'.repeat(length)
    // Numbers: Right Aligned (Pad Left with Zeros), 2 decimal places implies specific handling?
    // Mivne Achid usually asks for strict format like: 1234.56 or 0000123456 (implied decimal?).
    // Usually: "Amounts include cents" -> integer representation or explicit dot?
    // Spec 1.31: "Amount fields... include 2 decimal positions". e.g. 100.00 -> 100.00
    // Usually it specifies length including dot.

    // Simplification for standard fields (Check spec usually):
    // Standard: Right aligned, Zero padded.
    const s = num.toFixed(2)
    if (s.length > length) return s.slice(0, length) // Should not happen ideally
    return s.padStart(length, '0')
}

function formatInt(num: number | null | undefined, length: number): string {
    if (num === null || num === undefined) return '0'.repeat(length)
    const s = Math.floor(num).toString()
    return s.slice(0, length).padStart(length, '0')
}

function formatDate(date: Date | null | undefined): string {
    if (!date) return '00000000'
    return format(date, 'yyyyMMDD')
}

function formatTime(date: Date | null | undefined): string {
    if (!date) return '0000'
    return format(date, 'HHmm')
}


// --- Record Generators ---

// A000 - Open Format Header (Not strictly BKMVDATA but usually part of the stream or just file start?)
// BKMVDATA.TXT usually starts with the records directly. 
// BUT, usually there's a file header/footer record structure? 
// Mivne Achid usually implies flat list of records: B100, B110...

// We will stick to the requested file structure.
// BKMVDATA.TXT contains: B100, B110, C100, D110...

// --- Record Definitions ---

/*
  B100: Journal Entry (Tnua Yoman)
  Required for every Invoice/Receipt.
  
  Fields (Partial Mapping):
  - Record Type: "B100" (4)
  - ID: Line Number (9)
  - Reference: InvoiceNum (20)
  - Date: YYYYMMDD (8)
  - Account Code (Credit/Debit): (15)
  - Amount: (15)
*/
function generateB100(idx: number, transaction: any): string {
    // This is a placeholder for the complex B100 logic.
    // In a real implementation, we map Double Entry bookkeeping here.
    return ''
}

/*
  C100: Document Header (Koteret Mismach)
  One per Invoice.
  
  Fields:
  - C100
  - Doc Type (3) (305=Invoice, 400=ReceiptInvc, 330=Receipt)
  - Doc Number (20)
  - Date (8)
  - Total Amount (15)
  - VAT Amount (15)
  ...
*/
function generateC100(doc: any): string {
    let line = 'C100'
    line += formatString(doc.typeCode, 3)
    line += formatString(doc.number, 20)
    line += formatDate(doc.date)
    line += formatTime(doc.date)
    line += formatString(doc.clientName, 50)
    // ... amounts
    return line + '\r\n'
}


export async function generateOpenFormat(year: number) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        const businessProfile = await db.businessProfile.findUnique({ where: { userId } })
        if (!businessProfile || !businessProfile.companyId) {
            return { success: false, error: 'Missing Business Profile (Company ID required)' }
        }

        // Fetch Data for the year
        const startDate = new Date(year, 0, 1)
        const endDate = new Date(year, 11, 31, 23, 59, 59)

        const invoices = await db.invoice.findMany({
            where: {
                userId,
                status: { in: ['PAID', 'SENT', 'SIGNED'] },
                issueDate: { gte: startDate, lte: endDate }
            },
            include: { client: true, lineItems: true },
            orderBy: { invoiceNumber: 'asc' }
        })

        // -- Generate INI.TXT --
        let iniContent = '[Global Info]\r\n'
        iniContent += `TaxId=${businessProfile.companyId}\r\n`
        iniContent += `Year=${year}\r\n`
        iniContent += `Software=BudgetManagerPlus\r\n`
        iniContent += `Version=1.0\r\n`
        iniContent += `CompanyName=${formatString(businessProfile.companyName, 20)}\r\n`


        // -- Generate BKMVDATA.TXT --
        let bkmvContent = ''

        // Helper for C100 (Document Header)
        // Fields: RecordType(4), DocType(3), DocNum(20), IssueDate(8), IssueTime(4), ClientName(50), 
        //         ClientAddress(50), ClientTaxId(9), TotalNoVat(15), VatAmount(15), Total(15),
        //         Discount(15), Currency(3)...
        const makeC100 = (inv: typeof invoices[0]) => {
            let line = 'C100'
            line += '305' // Invoice Type (Subject to change based on inv.type)
            line += formatString(inv.invoiceNumber, 20)
            line += formatDate(inv.issueDate)
            line += formatTime(inv.issueDate)
            line += formatString(inv.client?.name || inv.guestClientName || 'General Client', 50)
            line += formatString(inv.client?.address || '', 50)
            line += formatString(inv.client?.taxId || '000000000', 9)
            line += formatNumber(inv.subtotal, 15)
            line += formatNumber(inv.vatAmount, 15)
            line += formatNumber(inv.total, 15)
            line += formatNumber(0, 15) // Discount
            line += 'ILS' // Currency
            // Padding to end of record (usually 256 bytes or until newline)
            return line + '\r\n'
        }

        // Helper for D110 (Line Items)
        // Fields: RecordType(4), DocType(3), DocNum(20), LineNum(4), ItemCode(20), ItemName(100),
        //         Unit(4), Quantity(12.2), Price(12.2), Discount(12.2), Total(12.2), VatRate(4)
        const makeD110 = (inv: typeof invoices[0], item: typeof invoices[0]['lineItems'][0], idx: number) => {
            let line = 'D110'
            line += '305'
            line += formatString(inv.invoiceNumber, 20)
            line += formatInt(idx, 4)
            line += formatString(item.id.slice(-5), 20) // Pseudo code
            line += formatString(item.description, 100)
            line += formatString('UNIT', 4)
            line += formatNumber(item.quantity, 12) // Format might need adjustment for decimals
            line += formatNumber(item.price, 12)
            line += formatNumber(0, 12) // Discount
            line += formatNumber(item.total, 12)
            line += formatInt(17, 4) // Vat Rate (17%)
            return line + '\r\n'
        }

        for (const inv of invoices) {
            // C100
            bkmvContent += makeC100(inv)

            // D110 (Lines)
            inv.lineItems.forEach((item, idx) => {
                bkmvContent += makeD110(inv, item, idx + 1)
            })
        }

        // Encode to Windows-1255
        const iniBuffer = iconv.encode(iniContent, 'win1255')
        const bkmvBuffer = iconv.encode(bkmvContent, 'win1255')

        // -- Bundling --
        const zip = new JSZip()

        // Folder Name: OPENFRMT
        const folder = zip.folder('OPENFRMT')
        if (!folder) throw new Error('Failed to create folder')

        // Inside: TaxId.Year (e.g., 512345678.2024)
        const subFolderName = `${businessProfile.companyId}.${year}`
        const subFolder = folder.folder(subFolderName)
        if (!subFolder) throw new Error('Failed to create subfolder')

        // INI.TXT
        subFolder.file('INI.TXT', iniBuffer)

        // BKMVDATA.ZIP (Inner Zip)
        const innerZip = new JSZip()
        innerZip.file('BKMVDATA.TXT', bkmvBuffer)
        const innerZipBlob = await innerZip.generateAsync({ type: 'nodebuffer' })

        subFolder.file('BKMVDATA.ZIP', innerZipBlob)


        // Generate Final ZIP
        const finalZip = await zip.generateAsync({ type: 'base64' }) // Return base64 for download

        return {
            success: true,
            data: finalZip,
            filename: `OpenFormat_${businessProfile.companyId}_${year}.zip`,
            stats: {
                invoices: invoices.length,
                totalAmount: invoices.reduce((sum, i) => sum + i.total, 0)
            }
        }

    } catch (error) {
        console.error('generateOpenFormat error:', error)
        return { success: false, error: 'Failed to generate files' }
    }
}
