import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateCategoryColors() {
    console.log('🎨 Updating category colors...\n')

    const updates = [
        {
            name: 'ספורט',
            color: 'bg-green-500 text-white border-green-600',
            icon: 'Dumbbell'
        },
        {
            name: 'אפליקציות ומינויים',
            color: 'bg-purple-500 text-white border-purple-600',
            icon: 'Smartphone'
        },
        {
            name: 'ביטוחים',
            color: 'bg-blue-500 text-white border-blue-600',
            icon: 'Shield'
        }
    ]

    for (const update of updates) {
        try {
            const result = await prisma.category.updateMany({
                where: {
                    name: update.name,
                    type: 'expense'
                },
                data: {
                    color: update.color
                }
            })

            if (result.count > 0) {
                console.log(`✅ Updated "${update.name}" - ${result.count} record(s)`)
                console.log(`   Color: ${update.color}`)
                console.log(`   Icon: ${update.icon}\n`)
            } else {
                console.log(`⚠️  No records found for "${update.name}" - creating new category...\n`)

                // Create the category if it doesn't exist
                await prisma.category.create({
                    data: {
                        name: update.name,
                        type: 'expense',
                        color: update.color,
                        scope: 'PERSONAL'
                    }
                })
                console.log(`✅ Created "${update.name}"\n`)
            }
        } catch (error) {
            console.error(`❌ Error updating "${update.name}":`, error)
        }
    }

    console.log('✨ Done!')
}

updateCategoryColors()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
