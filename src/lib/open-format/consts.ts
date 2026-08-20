// Mivne Achid 1.31 Constants

export const RECORD_TYPES = {
    HEADER: 'A100',
    ACCOUNT: 'B110', // Karteset
    JOURNAL: 'B100', // Pkudat Yoman
    ITEM: 'M100', // Pritim
    DOC_HEADER: 'C100', // Koteret Mismach
    DOC_DETAIL: 'D110', // Shurat Prit
    DOC_PAYMENT: 'D120', // Shurat Kabala
    FOOTER: 'Z900'
}

export const DOC_TYPES = {
    INVOICE: '305', // Heshbonit Mas
    RECEIPT: '400', // Kabala
    INVOICE_RECEIPT: '320', // Heshbonit Mas Kabala
    CREDIT_NOTE: '330' // Heshbonit Zikuy
}

export const VAT_TYPES = {
    INCLUDED: '0', // Vat Included
    EXCLUDED: '1', // Vat Added
    EXEMPT: '2' // Exempt
}
