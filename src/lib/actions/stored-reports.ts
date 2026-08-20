'use server'

import { authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { getProfitLossData } from './reports'
import { revalidatePath } from 'next/cache'

// We need to ensure `generateOpenFormatData` is available or move the logic here.
// It seems `downloadOpenFormat` in `open-format.ts` does both generation and download trigger?
// Let's check `src/lib/actions/open-format.ts` first. I might need to refactor it to separate generation.

export async function saveBkmvData(year: number) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // 1. Fetch Data
        const reportResult = await getProfitLossData(year)
        if (!reportResult.success || !reportResult.data) {
            throw new Error('Failed to fetch report data')
        }

        // 2. Generate Open Format ZIP
        const { generateOpenFormatFiles } = await import('@/lib/open-format/generator')
        const result = await generateOpenFormatFiles({ year })

        // 3. Save to DB
        // We store the ZIP base64 data.
        await db.storedReport.create({
            data: {
                userId,
                year,
                type: 'BKMVDATA', // Keeping type for backward compat, but content is now ZIP
                data: result.data,
                fileName: result.filename
            }
        })

        return { success: true, message: 'דוח נשמר בהצלחה במערכת' }

    } catch (error) {
        console.error('saveBkmvData error:', error)
        return { success: false, error: 'Failed to save report' }
    }
}
