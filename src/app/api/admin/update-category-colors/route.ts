import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
    try {
        const updates = [
            {
                name: 'ספורט',
                color: 'bg-green-500 text-white border-green-600'
            },
            {
                name: 'אפליקציות ומינויים',
                color: 'bg-purple-500 text-white border-purple-600'
            },
            {
                name: 'ביטוחים',
                color: 'bg-blue-500 text-white border-blue-600'
            }
        ]

        const results = []

        for (const update of updates) {
            const result = await prisma.category.updateMany({
                where: {
                    name: update.name,
                    type: 'expense'
                },
                data: {
                    color: update.color
                }
            })

            results.push({
                name: update.name,
                updated: result.count,
                color: update.color
            })
        }

        return NextResponse.json({
            success: true,
            results,
            message: 'Category colors updated successfully'
        })
    } catch (error) {
        console.error('Error updating category colors:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to update category colors' },
            { status: 500 }
        )
    }
}
