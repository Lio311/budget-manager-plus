
import { prisma } from '../src/lib/db'

async function main() {
    console.log('Checking categories...')
    const categories = await prisma.category.findMany()
    console.log(`Found ${categories.length} categories.`)
    console.log(categories)

    if (categories.length > 0) {
        const user = await prisma.user.findUnique({ where: { id: categories[0].userId } })
        console.log('First category belongs to user:', user?.email)
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
