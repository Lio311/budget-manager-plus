import { fmtStr, fmtNum, fmtInt, fmtDate, fmtTime } from './utils'
import { RECORD_TYPES, DOC_TYPES, VAT_TYPES } from './consts'

// --- Types ---
export interface OpenFormatOptions {
    dealerId: string
    companyName: string
    softwareName?: string
}

// --- A100: File Header ---
export function makeA100(opts: OpenFormatOptions, date: Date = new Date()): string {
    // Fields: Record(4), Osek(9), Date(8), Time(4), Currency(3), Encd(10), Soft(20)
    return [
        RECORD_TYPES.HEADER,
        fmtStr(opts.dealerId, 9),
        fmtDate(date),
        fmtTime(date),
        'ILS',
        fmtStr('WINDOWS1255', 10), // Encoding hint
        fmtStr(opts.softwareName || 'BudgetManager', 20),
        fmtStr('', 50) // Filler
    ].join('') + '\r\n'
}

// --- B110: Account/Client (Karteset) ---
export function makeB110(accountKey: string, name: string, taxId: string, address: string = ''): string {
    // Fields: Record(4), Key(15), Name(50), Address(50), City(20), Zip(7), Osek(9)
    return [
        RECORD_TYPES.ACCOUNT,
        fmtStr(accountKey, 15),
        fmtStr(name, 50),
        fmtStr(address, 50),
        fmtStr('', 20), // City
        fmtStr('', 7),  // Zip
        fmtStr(taxId, 9),
        fmtStr('', 50) // Filler
    ].join('') + '\r\n'
}

// --- M100: Item (Pritim) ---
export function makeM100(itemCode: string, name: string): string {
    // Fields: Record(4), Code(20), Name(50), Unit(4), Class(20)
    return [
        RECORD_TYPES.ITEM,
        fmtStr(itemCode, 20),
        fmtStr(name, 50),
        fmtStr('UNIT', 4),
        fmtStr('', 20), // Classification
        fmtStr('', 50)  // Filler
    ].join('') + '\r\n'
}

// --- C100: Document Header ---
export interface C100Data {
    docType: string // 305, 330
    docNum: string
    date: Date
    clientKey: string // Link to B110
    clientName: string
    clientTaxId: string
    amountNoVat: number
    vatAmount: number
    totalAmount: number
    discountAmount?: number
}

export function makeC100(data: C100Data): string {
    // Fields: Rec(4), Type(3), Num(20), Date(8), Time(4), ClientName(50), Addr(50), Osek(9), 
    //         Key(15), UserKey(15), NoVat(15.2), Vat(15.2), Total(15.2), Disc(15.2), Cur(3)
    return [
        RECORD_TYPES.DOC_HEADER,
        fmtStr(data.docType, 3),
        fmtStr(data.docNum, 20),
        fmtDate(data.date),
        fmtTime(data.date),
        fmtStr(data.clientName, 50),
        fmtStr('', 50), // Client Addr
        fmtStr(data.clientTaxId, 9),
        fmtStr(data.clientKey, 15), // Link to B110
        fmtStr('', 15), // User Key?
        fmtNum(data.amountNoVat, 15),
        fmtNum(data.vatAmount, 15),
        fmtNum(data.totalAmount, 15),
        fmtNum(data.discountAmount || 0, 15),
        'ILS'
    ].join('') + '\r\n'
}

// --- D110: Document Detail (Line Item) ---
export interface D110Data {
    docType: string
    docNum: string
    lineNum: number
    itemCode: string // Link to M100
    itemName: string
    quantity: number
    price: number
    total: number
}

export function makeD110(data: D110Data): string {
    // Fields: Rec(4), Type(3), Num(20), Line(4), ItmType(1), Code(20), Name(50), Unit(4), 
    //         Qty(12.2), Price(12.2), Disc(12.2), Total(12.2), VatRate(4)
    // Note: VatRate is usually index or %. 17.00 -> 1700 or code?
    // Spec: Vat Rate Code (1) usually? Or Value. 
    // Let's check common usage: Usually 17.

    return [
        RECORD_TYPES.DOC_DETAIL,
        fmtStr(data.docType, 3),
        fmtStr(data.docNum, 20),
        fmtInt(data.lineNum, 4),
        '1', // Item Type (1=Normal)
        fmtStr(data.itemCode, 20),
        fmtStr(data.itemName, 50),
        fmtStr('UNIT', 4),
        fmtNum(data.quantity, 12),
        fmtNum(data.price, 12),
        fmtNum(0, 12), // Discount
        fmtNum(data.total, 12),
        '1' // Vat Status Code (1=Normal/Vatable) - Simplification
    ].join('') + '\r\n'
}

// --- B100: Journal Entry (Simplified One-to-One) ---
// Every doc usually creates a header move.
export function makeB100(
    num: number,
    docNum: string,
    date: Date,
    debitKey: string,
    creditKey: string,
    amount: number,
    details: string
): string {
    // Rec(4), Num(9), Ref(20), Date(8), Deb(15), Cred(15), Val(15), Det(50)
    return [
        RECORD_TYPES.JOURNAL,
        fmtInt(num, 9),
        fmtStr(docNum, 20),
        fmtDate(date),
        fmtStr(debitKey, 15),
        fmtStr(creditKey, 15),
        fmtNum(amount, 15),
        fmtStr(details, 50),
        fmtDate(date) // Value Date
    ].join('') + '\r\n'
}

// --- Z900: Footer ---
export function makeZ900(dealerId: string, totalRecords: number): string {
    // Rec(4), Osek(9), TotalLines(15)
    return [
        RECORD_TYPES.FOOTER,
        fmtStr(dealerId, 9),
        fmtInt(totalRecords, 15)
    ].join('') + '\r\n'
}
