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

        // 2. Generate BKMVDATA String
        const { generateBkmvData } = await import('@/lib/open-format/generator')
        const { bkmv } = await generateBkmvData(year)
        const fileContent = bkmv

        // 3. Save to DB
        const filename = `BKMVDATA-${year}.txt`

        // Check if exists? Optional, maybe we want history.
        // Schema doesn't enforce unique year/type, so we can store history or update.
        // Let's create new for history.

        await db.storedReport.create({
            data: {
                userId,
                year,
                type: 'BKMVDATA',
                data: fileContent,
                fileName: filename
            }
        })

        return { success: true, message: 'דוח נשמר בהצלחה במערכת' }

    } catch (error) {
        console.error('saveBkmvData error:', error)
        return { success: false, error: 'Failed to save report' }
    }
}
