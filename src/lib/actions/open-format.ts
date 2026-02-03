'use server'

import { generateOpenFormatFiles } from '@/lib/open-format/generator'

export async function generateOpenFormat(year: number) {
    try {
        const result = await generateOpenFormatFiles(year)

        return {
            success: true,
            data: result.data,
            filename: result.filename,
            stats: {
                invoices: result.count || 0,
                totalAmount: 0 // Not strictly needed for the download
            }
        }

    } catch (error) {
        console.error('generateOpenFormat error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Failed to generate files' }
    }
}
