import { renderToBuffer, Font } from '@react-pdf/renderer'
import { SummaryReportTemplate, SummaryReportData } from '@/lib/pdf/summary-report-template'
import { ALEF_FONT_BASE64 } from '@/lib/pdf/font-data'
import React from 'react'

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

export async function generateSummaryReportPDFBuffer(data: SummaryReportData): Promise<Buffer> {
    registerFont()
    return await renderToBuffer(<SummaryReportTemplate {...data} />)
}
