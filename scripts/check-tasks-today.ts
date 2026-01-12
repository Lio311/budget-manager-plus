import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkTasksCompletedToday() {
    try {
        // Get tasks with status DONE that were updated on 2026-01-12
        const startOfDay = new Date('2026-01-12T00:00:00Z')
        const endOfDay = new Date('2026-01-12T23:59:59Z')

        const tasks = await prisma.projectTask.findMany({
            where: {
                status: 'DONE',
                updatedAt: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            select: {
                id: true,
                title: true,
                updatedAt: true,
                createdAt: true
            }
        })

        console.log(`\n📊 משימות שנסגרו ב-12.1.2026:`)
        console.log(`סה"כ: ${tasks.length} משימות\n`)

        tasks.forEach((task, i) => {
            console.log(`${i + 1}. ${task.title}`)
            console.log(`   נוצרה: ${task.createdAt.toLocaleString('he-IL')}`)
            console.log(`   עודכנה: ${task.updatedAt.toLocaleString('he-IL')}\n`)
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkTasksCompletedToday()
