'use server'

import { generateOpenFormatFiles } from '@/lib/open-format/generator'

export async function generateOpenFormat(options: { year?: number, startDate?: string, endDate?: string }) {
    try {
        const generationOptions = {
            year: options.year,
            startDate: options.startDate ? new Date(options.startDate) : undefined,
            endDate: options.endDate ? new Date(options.endDate) : undefined
        };
        const result = await generateOpenFormatFiles(generationOptions);

        return {
            success: true,
            data: result.data,
            filename: result.filename,
            stats: {
                invoices: result.stats?.invoices || 0,
                totalAmount: result.stats?.totalAmount || 0,
                counters: result.counters
            }
        }

    } catch (error) {
        console.error('generateOpenFormat error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Failed to generate files' }
    }
}
