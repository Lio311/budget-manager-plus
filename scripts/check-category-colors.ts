import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCategoryColors() {
    console.log('🔍 Checking category colors in DB...\n')

    const categories = await prisma.category.findMany({
        where: {
            type: 'expense',
            name: {
                in: ['ספורט', 'ביטוחים', 'אפליקציות ומינויים']
            }
        },
        select: {
            name: true,
            color: true,
            scope: true
        }
    })

    if (categories.length === 0) {
        console.log('❌ No categories found in DB')
    } else {
        categories.forEach(cat => {
            console.log(`📦 ${cat.name}`)
            console.log(`   Color: ${cat.color || '(null)'}`)
            console.log(`   Scope: ${cat.scope}`)
            console.log('')
        })
    }

    await prisma.$disconnect()
}

checkCategoryColors()
