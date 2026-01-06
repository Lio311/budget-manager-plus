'use server'

import { generateBkmvData } from '@/lib/open-format/generator'

export async function downloadOpenFormat(year: number) {
    try {
        const { ini, bkmv } = await generateBkmvData(year)

        // In a real app, we might zip these. 
        // For simplicity, we'll return strings and let the client zip or download distinct content.
        // Actually, easiest is to zip on server if we have 'jszip' or similar, OR just return content.

        return {
            success: true,
            data: {
                ini,
                bkmv,
                filename: `OpenFormat-${year}`
            }
        }
    } catch (error: any) {
        console.error('downloadOpenFormat error:', error)
        return { success: false, error: error.message || 'Failed to generate files' }
    }
}
