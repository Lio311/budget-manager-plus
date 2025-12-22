
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const userId = 'cmjh0tbtb000k79y8k11hbp8t' // Lior's internal ID from previous run
    console.log('Adding category for user internal ID:', userId)

    try {
        const cat = await prisma.category.create({
            data: {
                userId: userId,
                name: 'Test Category Script',
                type: 'expense',
                color: 'bg-blue-500'
            }
        })
        console.log('Category created successfully:', cat)
    } catch (e) {
        console.error('Error creating category:')
        console.error(e)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
