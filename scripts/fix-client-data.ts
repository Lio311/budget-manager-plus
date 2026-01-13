import { PrismaClient } from '@prisma/client'
import { startOfDay } from 'date-fns'

const prisma = new PrismaClient()

const PRESET_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#D946EF', // Fuchsia
    '#EC4899', // Pink
    '#F43F5E', // Rose
]

async function main() {
    console.log('Starting Client Data Fix...')

    // 1. Fix Future Subscription Incomes Status
    console.log('-----------------------------------')
    console.log('Fixing Future Incomes Status...')

    // Find all incomes that:
    // - Are in the future (> now)
    // - Source indicates subscription ("מנוי -")
    // - Status is NOT PENDING (e.g. they are PAID)

    // Note: We'll be generous and say "Future" is anything strictly after TODAY
    // Because if it's today, maybe it's paid. If it's tomorrow+, it should probably be pending.
    const now = new Date()

    // We can't filter by source easily with startsWith in mass update sometimes, but let's try findMany first.
    const futureIncomes = await prisma.income.findMany({
        where: {
            date: { gt: now },
            source: { startsWith: 'מנוי -' },
            status: { not: 'PENDING' }
        }
    })

    console.log(`Found ${futureIncomes.length} future subscription incomes with incorrect status. Updating to PENDING...`)

    if (futureIncomes.length > 0) {
        const updateResult = await prisma.income.updateMany({
            where: {
                id: { in: futureIncomes.map(i => i.id) }
            },
            data: {
                status: 'PENDING',
                paymentDate: null // Clear payment date if it was set
            }
        })
        console.log(`Updated ${updateResult.count} incomes to PENDING.`)
    }

    // 2. Backfill Package Colors
    console.log('-----------------------------------')
    console.log('Backfilling Package Colors...')

    // Get all clients with a package name but NO color
    const clientsWithoutColor = await prisma.client.findMany({
        where: {
            packageName: { not: null },
            // We want to update ALL clients for consistency, or just those missing?
            // User said: "currently for all categories that users already added choose a random color"
            // This implies existing ones too.
            // Let's check if we want to overwrite existing colors?
            // "allow the user to change color" -> implies we shouldn't overwrite if they set it.
            // But current implementation defaults to null.
            subscriptionColor: null
        },
        select: { id: true, packageName: true }
    })

    console.log(`Found ${clientsWithoutColor.length} clients with packages but no color.`)

    // Group by Package Name
    const packageGroups: { [key: string]: string[] } = {}
    clientsWithoutColor.forEach(c => {
        if (c.packageName) {
            if (!packageGroups[c.packageName]) {
                packageGroups[c.packageName] = []
            }
            packageGroups[c.packageName].push(c.id)
        }
    })

    const packages = Object.keys(packageGroups)
    console.log(`Found ${packages.length} unique packages to assign colors.`)

    for (const pkgName of packages) {
        // Pick a random color
        const randomColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]

        console.log(`Assigning color ${randomColor} to package "${pkgName}" (${packageGroups[pkgName].length} clients)`)

        await prisma.client.updateMany({
            where: {
                id: { in: packageGroups[pkgName] }
            },
            data: {
                subscriptionColor: randomColor
            }
        })
    }

    console.log('-----------------------------------')
    console.log('Fix Complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
