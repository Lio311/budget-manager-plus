import { fmtStr, fmtNum, fmtInt, fmtDate, fmtTime } from './utils'
import { RECORD_TYPES, DOC_TYPES, VAT_TYPES } from './consts'

// --- Types ---
export interface OpenFormatOptions {
    dealerId: string
    companyName: string
    softwareName?: string
}

// --- A000: INI Header Record (Mivne Achid 1.31 Flat) ---
export function makeA000(opts: OpenFormatOptions, totalRecords: number, year: number): string {
    return [
        'A000',
        // 1001 Future? Skip/6 spaces? Spec usually doesn't have a gap here in standard flat files unless aligned.
        // Assuming loose concat unless offset specified.
        fmtNum(totalRecords, 15), // 1002
        fmtStr(opts.dealerId, 9), // 1003
        fmtStr(opts.dealerId, 15), // 1004 (File ID/Main ID - padding Osek)
        '&OF1.31&', // 1005
        '00000000', // 1006 Soft Reg
        fmtStr(opts.softwareName || 'BudgetManager', 20), // 1007
        fmtStr('1.0', 20), // 1008 Version
        '000000000', // 1009 Man Osek
        fmtStr('LiorDev', 20), // 1010 Man Name
        '2', // 1011 Soft Type
        fmtStr('C:\\OpenFormat', 50), // 1012 Path
        '2', // 1013 Acc Type
        '1', // 1014 Balance
        fmtStr(opts.dealerId, 9), // 1015 Comp Reg
        '000000000', // 1016 Deduction
        fmtStr('', 0), // 1017 Future?
        fmtStr(opts.companyName, 50), // 1018 Name
        fmtStr('', 50), // 1019 Addr
        fmtStr('', 10), // 1020 House
        fmtStr('', 20), // 1021 City
        fmtStr('', 7),  // 1022 Zip
        fmtNum(year, 4), // 1023 Year
        fmtDate(new Date(year, 0, 1)), // 1024 Start
        fmtDate(new Date(year, 11, 31)), // 1025 End
        fmtDate(new Date()), // 1026 Gen Date
        fmtTime(new Date()), // 1027 Gen Time
        '0', // 1028 Lang
        '2', // 1029 Charset
        fmtStr('JSZip', 20), // 1030 Zip Name
        'ILS', // 1032 Currency
        '0' // 1034 Branches
    ].join('') + '\r\n'
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
        fmtNum(data.amountNoVat + (data.discountAmount || 0), 15), // Total before discount
        fmtNum(data.discountAmount || 0, 15),                      // Discount amount
        fmtNum(data.amountNoVat, 15),                              // Total before VAT
        fmtNum(data.vatAmount, 15),                                // VAT amount
        fmtNum(data.totalAmount, 15),                              // Total with VAT (Field 1223)
        fmtNum(0, 15),                                             // Withholding Tax
        'ILS'
    ].join('') + '\r\n'
}

// --- D120: Receipt Detail (Payment Line) ---
export interface D120Data {
    docType: string
    docNum: string
    lineNum: number
    paymentMethodCode: string // '1'=Cash, '2'=Check, '3'=Credit Card, '4'=Bank Transfer
    bankNum?: string
    branchNum?: string
    accountNum?: string
    checkNum?: string // Check number or Credit Card last 4 digits
    date: Date
    amount: number
}

export function makeD120(data: D120Data): string {
    // Fields: Rec(4), Type(3), Num(20), Line(4), PayMethod(1), Bank(2), Branch(3), Account(15), 
    //         Check/CC(20), Date(8), Amount(15.2)
    return [
        RECORD_TYPES.DOC_PAYMENT,
        fmtStr(data.docType, 3),
        fmtStr(data.docNum, 20),
        fmtInt(data.lineNum, 4),
        fmtStr(data.paymentMethodCode, 1),
        fmtStr(data.bankNum || '00', 2),
        fmtStr(data.branchNum || '000', 3),
        fmtStr(data.accountNum || '000000000000000', 15),
        fmtStr(data.checkNum || '', 20),
        fmtDate(data.date),
        fmtNum(data.amount, 15)
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
