import { format } from 'date-fns'
import { RECORD_TYPES, DOC_TYPES } from './consts'

class RecordBuilder {
    str: string;
    constructor(length: number) {
        this.str = ' '.repeat(length);
    }
    set(offset: number, length: number, val: string | number, padChar = ' ', padLeft = false) {
        let v = String(val).replace(/[\r\n\t]/g, ' ');
        if (v.length > length) v = v.substring(0, length);
        if (padLeft) v = v.padStart(length, padChar);
        else v = v.padEnd(length, padChar);
        const idx = offset - 1;
        this.str = this.str.substring(0, idx) + v + this.str.substring(idx + length);
    }
    get() { return this.str + '\r\n'; }
}

export function fmtNum(num: number | null | undefined, length: number, decimals: number = 2): string {
    const multiplier = Math.pow(10, decimals);
    let n = num || 0;
    let s = Math.round(Math.abs(n) * multiplier).toString();
    const sign = n < 0 ? '-' : '+';
    // Mivne Achid signed numeric (X9...v99) has sign as FIRST character
    return sign + s.padStart(length - 1, '0');
}

export function fmtDate(date: Date | null | undefined): string {
    if (!date) return '00000000';
    return format(date, 'yyyyMMdd');
}

export function fmtTime(date: Date | null | undefined): string {
    if (!date) return '0000';
    try { return format(date, 'HHmm'); } catch { return '0000'; }
}

export interface OpenFormatOptions {
    dealerId: string;
    companyName: string;
    softwareName?: string;
}

export function makeIniSummary(recordType: string, count: number): string {
    const rb = new RecordBuilder(19);
    rb.set(1, 4, recordType);
    rb.set(5, 15, count, '0', true);
    return rb.get();
}

export function makeA000(opts: OpenFormatOptions, totalRecords: number, year: number): string {
    const rb = new RecordBuilder(421);
    rb.set(1, 4, 'A000');
    rb.set(10, 15, totalRecords, '0', true); // 1002
    rb.set(25, 9, opts.dealerId, '0', true); // 1003
    rb.set(34, 15, opts.dealerId, '0', true); // 1004 (Main ID, padded with 0)
    rb.set(49, 8, '&OF1.31&'); // 1005
    rb.set(57, 8, '99999999'); // 1006 (Registration num, 99999999 for testing to avoid zero-check)
    rb.set(65, 20, opts.softwareName || 'BudgetManager'); // 1007
    rb.set(85, 20, '1.0'); // 1008
    rb.set(105, 9, opts.dealerId, '0', true); // 1009
    rb.set(114, 20, 'LiorDev'); // 1010
    rb.set(134, 1, '1'); // 1011
    rb.set(135, 50, 'C:\\OpenFormat'); // 1012
    rb.set(185, 1, '2'); // 1013
    rb.set(186, 1, '1'); // 1014 (Accounting balance required = 1)
    rb.set(187, 9, opts.dealerId, '0', true); // 1015
    rb.set(196, 9, '000000000'); // 1016
    rb.set(226, 50, opts.companyName); // 1017
    rb.set(363, 4, year, '0', true); // 1022
    rb.set(367, 8, fmtDate(new Date(year, 0, 1))); // 1023
    rb.set(375, 8, fmtDate(new Date(year, 11, 31))); // 1024
    rb.set(383, 8, fmtDate(new Date())); // 1026
    rb.set(391, 4, fmtTime(new Date())); // 1027
    rb.set(395, 1, '0'); // 1028
    rb.set(396, 1, '2'); // 1029
    rb.set(397, 20, 'BKMVDATA.ZIP'); // 1030
    rb.set(417, 3, 'ILS'); // 1032
    rb.set(420, 1, '0'); // 1034
    return rb.get();
}

export function makeA100(opts: OpenFormatOptions, recordNum: number = 1): string {
    const rb = new RecordBuilder(108);
    rb.set(1, 4, 'A100');
    rb.set(5, 9, recordNum, '0', true); // 1101 (Must be 1!)
    rb.set(14, 9, opts.dealerId, '0', true); // 1102
    rb.set(23, 15, opts.dealerId, '0', true); // 1103 (Main ID, padded with 0)
    rb.set(38, 8, '&OF1.31&'); // 1104
    return rb.get();
}

export function makeB110(recordNum: number, dealerId: string, accountKey: string, name: string, trialBalanceCode: string, clientTaxId: string = '000000000'): string {
    const rb = new RecordBuilder(376);
    rb.set(1, 4, 'B110');
    rb.set(5, 9, recordNum, '0', true); // 1401
    rb.set(14, 9, dealerId, '0', true); // 1402
    rb.set(23, 15, accountKey); // 1403
    rb.set(38, 50, name); // 1404
    rb.set(88, 15, trialBalanceCode); // 1405 (Trial Balance Code, MUST NOT BE EMPTY)
    rb.set(103, 30, 'Account'); // 1406
    rb.set(278, 15, fmtNum(0, 15, 2)); // 1414 Balance
    rb.set(293, 15, fmtNum(0, 15, 2)); // 1415 Debit
    rb.set(308, 15, fmtNum(0, 15, 2)); // 1416 Credit
    rb.set(327, 9, clientTaxId, '0', true); // 1419
    return rb.get();
}

export function makeM100(recordNum: number, dealerId: string, itemCode: string, name: string): string {
    const rb = new RecordBuilder(229);
    rb.set(1, 4, 'M100');
    rb.set(5, 9, recordNum, '0', true); // 1451
    rb.set(14, 9, dealerId, '0', true); // 1452
    rb.set(23, 20, itemCode); // 1453
    rb.set(63, 20, itemCode); // 1455
    rb.set(83, 50, name); // 1456
    rb.set(173, 20, 'UNIT'); // 1459
    rb.set(193, 12, fmtNum(0, 12, 2)); // 1460
    rb.set(205, 12, fmtNum(0, 12, 2)); // 1461
    rb.set(217, 12, fmtNum(0, 12, 2)); // 1462
    return rb.get();
}

export interface C100Data {
    recordNum: number; dealerId: string; docType: string; docNum: string; date: Date; clientKey: string;
    clientName: string; clientTaxId: string; amountNoVat: number; vatAmount: number; totalAmount: number; discountAmount?: number;
}
export function makeC100(data: C100Data): string {
    const rb = new RecordBuilder(409);
    rb.set(1, 4, 'C100');
    rb.set(5, 9, data.recordNum, '0', true); // 1201
    rb.set(14, 9, data.dealerId, '0', true); // 1202
    rb.set(23, 3, data.docType, '0', true); // 1203
    rb.set(26, 20, data.docNum); // 1204
    rb.set(46, 8, fmtDate(data.date)); // 1205
    rb.set(54, 4, fmtTime(data.date)); // 1206
    rb.set(58, 50, data.clientName); // 1207
    rb.set(253, 9, data.clientTaxId, '0', true); // 1215
    rb.set(262, 8, fmtDate(data.date)); // 1216
    rb.set(375, 15, data.clientKey); // 1225
    rb.set(401, 8, fmtDate(data.date)); // 1230
    return rb.get();
}

export interface D110Data {
    recordNum: number; dealerId: string; docType: string; docNum: string; lineNum: number;
    itemCode: string; itemName: string; quantity: number; price: number; total: number; date: Date;
}
export function makeD110(data: D110Data): string {
    const rb = new RecordBuilder(305);
    rb.set(1, 4, 'D110');
    rb.set(5, 9, data.recordNum, '0', true); // 1251
    rb.set(14, 9, data.dealerId, '0', true); // 1252
    rb.set(23, 3, data.docType, '0', true); // 1253
    rb.set(26, 20, data.docNum); // 1254
    rb.set(46, 4, data.lineNum, '0', true); // 1255
    rb.set(50, 3, '000'); // 1256 (Base doc type)
    rb.set(94, 30, data.itemName); // 1260
    rb.set(224, 17, fmtNum(data.quantity, 17, 4)); // 1264 (Quantity 4 decimals)
    rb.set(241, 15, fmtNum(data.price, 15, 2)); // 1265 (Price 2 decimals per spec)
    rb.set(286, 4, '1700'); // 1268 (VAT Rate e.g. 17.00%)
    rb.set(297, 8, fmtDate(data.date)); // 1272
    return rb.get();
}

export function makeB100(recordNum: number, dealerId: string, journalNum: number, docNum: string, date: Date, debitKey: string, creditKey: string, amount: number, details: string): string {
    const rb = new RecordBuilder(286);
    rb.set(1, 4, 'B100');
    rb.set(5, 9, recordNum, '0', true); // 1351
    rb.set(14, 9, dealerId, '0', true); // 1352
    rb.set(23, 10, journalNum, '0', true); // 1353
    rb.set(33, 5, 1, '0', true); // 1354
    rb.set(38, 8, '00000001'); // 1355
    rb.set(157, 8, fmtDate(date)); // 1362
    rb.set(165, 8, fmtDate(date)); // 1363
    rb.set(173, 15, debitKey); // 1364
    rb.set(188, 15, creditKey); // 1365
    rb.set(203, 1, '1'); // 1366
    rb.set(204, 3, 'ILS'); // 1367
    rb.set(207, 15, fmtNum(amount, 15, 2)); // 1368
    rb.set(222, 15, fmtNum(0, 15, 2)); // 1369
    rb.set(276, 8, fmtDate(date)); // 1375
    return rb.get();
}

export function makeZ900(dealerId: string, totalRecords: number): string {
    const rb = new RecordBuilder(61);
    rb.set(1, 4, 'Z900');
    rb.set(5, 9, totalRecords, '0', true); // 1151
    rb.set(14, 9, dealerId, '0', true); // 1152
    rb.set(23, 15, dealerId, '0', true); // 1153
    rb.set(38, 8, '&OF1.31&'); // 1154
    rb.set(46, 15, totalRecords, '0', true); // 1155
    return rb.get();
}
