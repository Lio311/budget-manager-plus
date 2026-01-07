
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const ron = await prisma.user.findFirst({
        where: {
            name: {
                contains: 'Ron',
                mode: 'insensitive' // Optional: if case insensitive search is needed
            }
        }
    })
    console.log('Found Ron:', ron)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
