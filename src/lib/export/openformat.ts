export function generateBkmvData(invoices: any[], creditNotes: any[], businessProfile: any): string {
    // This is a minimal stub for generating BKMVDATA.txt (OpenFormat / מבנה אחיד)
    // The real implementation needs to format each line exactly according to the Israel Tax Authority specification.
    
    let content = '';

    // Record Type A100 - Header
    content += `A100${pad(businessProfile?.companyId || '000000000', 9)}\n`;

    // Record Type C100 - Invoices
    for (const inv of invoices) {
        content += `C100${pad(inv.invoiceNumber, 9)}${pad(inv.total.toString(), 15)}\n`;
        // Record Type D110 - Line Items
        for (const item of inv.lineItems || []) {
            content += `D110${pad(inv.invoiceNumber, 9)}${pad(item.price.toString(), 15)}\n`;
        }
    }

    // Record Type Z900 - Footer
    content += `Z900${pad(invoices.length.toString(), 15)}\n`;

    return content;
}

function pad(str: string, length: number): string {
    return str.padEnd(length, ' ').substring(0, length);
}
