import { Font, renderToBuffer } from '@react-pdf/renderer'
import { ConsolidatedReportTemplate } from './consolidated-report-template'
import { ALEF_FONT_BASE64 } from './font-data'

let isFontRegistered = false

function registerFont() {
    if (isFontRegistered) return
    try {
        Font.register({
            family: 'Alef',
            src: `data:font/ttf;base64,${ALEF_FONT_BASE64}`
        })
        isFontRegistered = true
    } catch (error) {
        console.error('Failed to register PDF font:', error)
    }
}

export async function generateConsolidatedPDFBuffer(data: { invoices: any[], month: string, year: string, businessName: string }): Promise<Buffer> {
    registerFont()
    return await renderToBuffer(<ConsolidatedReportTemplate {...data} />)
}
