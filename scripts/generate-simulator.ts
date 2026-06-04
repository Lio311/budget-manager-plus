import fs from 'fs'
import path from 'path'
import iconv from 'iconv-lite'
import {
    makeA100, makeB110, makeM100, makeC100, makeD110, makeB100, makeZ900, makeA000, makeIniSummary
} from '../src/lib/open-format/records'
import { DOC_TYPES } from '../src/lib/open-format/consts'

async function run() {
    const dealerId = '318236338' // User's real ID
    const companyName = 'כספלי' // User's real company name
    const softwareName = 'Kesefly'
    const year = new Date().getFullYear() // 2026   
    let c100Count = 0, d110Count = 0, b100Count = 0, b110Count = 0, m100Count = 0

    let lines: string[] = []
    let totalRecords = 0
    
    const addLine = (str: string) => {
        lines.push(str)
        totalRecords++
    }

    // A100 Header
    addLine(makeA100({ dealerId, companyName, softwareName }, totalRecords + 1))
    
    // B110 Accounts
    const clientKey = 'C00001'
    const incomeAccKey = 'INC001'
    const taxAccKey = 'TAX001'
    const bankAccKey = 'BNK001'
    
    addLine(makeB110(totalRecords + 1, dealerId, clientKey, 'Test Client', 'CLIENT', '512345679'))
    addLine(makeB110(totalRecords + 1, dealerId, incomeAccKey, 'Income Account', 'INCOME', '000000000'))
    addLine(makeB110(totalRecords + 1, dealerId, taxAccKey, 'VAT Account', 'VAT', '000000000'))
    addLine(makeB110(totalRecords + 1, dealerId, bankAccKey, 'Bank Account', 'BANK', '000000000'))
    b110Count += 4
    
    // M100 Items
    const itemCode = 'ITEM-001'
    addLine(makeM100(totalRecords + 1, dealerId, itemCode, 'Test Item'))
    m100Count += 1
    
    let journalCounter = 1
    
    for (let i = 1; i <= 700; i++) {
        // C100 Document Header
        addLine(makeC100({
            recordNum: totalRecords + 1,
            dealerId,
            docType: DOC_TYPES.INVOICE,
            docNum: `INV-${i}`,
            date: new Date(year, 5, 1),
            clientKey,
            clientName: 'Test Client',
            clientTaxId: '512345679',
            amountNoVat: 100,
            vatAmount: 17,
            totalAmount: 117
        }))
        c100Count++
        
        // D110 Document Detail
        addLine(makeD110({
            recordNum: totalRecords + 1,
            dealerId,
            docType: DOC_TYPES.INVOICE,
            docNum: `INV-${i}`,
            lineNum: 1,
            itemCode,
            itemName: 'Test Item',
            quantity: 1,
            price: 100,
            total: 117,
            date: new Date(year, 5, 1)
        }))
        d110Count++
        
        // B100 Journal Entry
        addLine(makeB100(
            totalRecords + 1,
            dealerId,
            journalCounter++,
            `INV-${i}`,
            new Date(year, 5, 1),
            clientKey,
            incomeAccKey,
            117,
            'Sales Invoice'
        ))
        b100Count++
    }

    // Z900 Footer
    addLine(makeZ900(dealerId, totalRecords + 1))
    
    const bkmvContent = lines.join('')
    const bkmvBuffer = iconv.encode(bkmvContent, 'win1255')

    let iniLines = []
    iniLines.push(makeA000({ dealerId, companyName, softwareName }, totalRecords, year))
    iniLines.push(makeIniSummary('B110', b110Count))
    iniLines.push(makeIniSummary('M100', m100Count))
    iniLines.push(makeIniSummary('C100', c100Count))
    iniLines.push(makeIniSummary('D110', d110Count))
    iniLines.push(makeIniSummary('B100', b100Count))
    
    const iniContent = iniLines.join('')
    const iniBuffer = iconv.encode(iniContent, 'win1255')

    const outDir = path.join(process.cwd(), 'public', 'simulator')
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
    }

    fs.writeFileSync(path.join(outDir, 'BKMVDATA.TXT'), bkmvBuffer)
    fs.writeFileSync(path.join(outDir, 'INI.TXT'), iniBuffer)
    
    console.log(`Generated simulator files at ${outDir} with ${totalRecords} records.`)
}

run().catch(console.error)
