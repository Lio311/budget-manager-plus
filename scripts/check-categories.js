
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Checking categories...')
    const categories = await prisma.category.findMany()
    console.log(`Found ${categories.length} categories.`)
    console.log(JSON.stringify(categories, null, 2))

    if (categories.length > 0) {
        const user = await prisma.user.findUnique({ where: { id: categories[0].userId } })
        console.log('First category belongs to user email:', user ? user.email : 'Unknown')
    } else {
        console.log('No categories found. Checking users...')
        const users = await prisma.user.findMany()
        console.log(`Found ${users.length} users.`)
        users.forEach(u => console.log(`User: ${u.email} (${u.id})`))
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
