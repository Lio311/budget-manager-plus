import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_EXPENSE_CATEGORIES } from '@/lib/constants/categories'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const { userId } = auth()
        // Optional: specific admin check if needed, or just allow logged-in users to trigger it (safe enough for now)
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const users = await prisma.user.findMany({
            include: {
                categories: {
                    where: { type: 'expense' },
                    select: { name: true }
                }
            }
        })

        let totalAdded = 0
        const results = []

        for (const user of users) {
            const existingNames = new Set(user.categories.map(c => c.name))
            const missing = DEFAULT_EXPENSE_CATEGORIES.filter(d => !existingNames.has(d.name))

            if (missing.length > 0) {
                await prisma.category.createMany({
                    data: missing.map(cat => ({
                        userId: user.id,
                        name: cat.name,
                        type: 'expense',
                        color: cat.color,
                        scope: 'PERSONAL' // Adding to PERSONAL scope by default for seeding
                    }))
                })
                totalAdded += missing.length
                results.push({ userId: user.id, added: missing.map(c => c.name) })
            }
        }

        return NextResponse.json({
            success: true,
            totalUsersScanned: users.length,
            totalCategoriesAdded: totalAdded,
            details: results
        })
    } catch (error: any) {
        console.error('Backfill Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
