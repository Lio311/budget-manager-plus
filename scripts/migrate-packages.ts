
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migratePackages() {
    console.log('🔄 Starting packages migration...')

    try {
        const users = await prisma.user.findMany({
            include: {
                clients: true,
                clientPackages: true
            }
        })

        console.log(`Found ${users.length} users to process`)

        for (const user of users) {
            console.log(`Processing user: ${user.email} (${user.id})`)
            const userClients = user.clients.filter(c => c.packageName && !c.packageId)

            if (userClients.length === 0) {
                console.log('  No clients to migrate for this user.')
                continue
            }

            // Group by package name and color
            const packagesToCreate = new Map<string, { name: string, color: string, clientIds: string[] }>()

            for (const client of userClients) {
                if (!client.packageName) continue

                const key = `${client.packageName}-${client.subscriptionColor || '#3B82F6'}`

                if (!packagesToCreate.has(key)) {
                    packagesToCreate.set(key, {
                        name: client.packageName,
                        color: client.subscriptionColor || '#3B82F6',
                        clientIds: []
                    })
                }

                packagesToCreate.get(key)?.clientIds.push(client.id)
            }

            console.log(`  Found ${packagesToCreate.size} unique packages to create`)

            const createdPackagesCache = new Map<string, any>()

            for (const [key, pkgData] of packagesToCreate.entries()) {
                const normalizedName = pkgData.name.toLowerCase()

                // 1. Check if package with this name already exists for user (case insensitive)
                let existingPackage = user.clientPackages.find(
                    p => p.name.toLowerCase() === normalizedName
                ) || createdPackagesCache.get(normalizedName)

                if (!existingPackage) {
                    console.log(`  Creating package: "${pkgData.name}" (Color: ${pkgData.color})`)
                    existingPackage = await prisma.clientPackage.create({
                        data: {
                            userId: user.id,
                            name: pkgData.name,
                            color: pkgData.color
                        }
                    })
                    createdPackagesCache.set(normalizedName, existingPackage)
                } else {
                    console.log(`  Linking to existing package: "${existingPackage.name}"`)
                }

                // Update clients
                if (pkgData.clientIds.length > 0) {
                    await prisma.client.updateMany({
                        where: {
                            id: { in: pkgData.clientIds }
                        },
                        data: {
                            packageId: existingPackage.id
                        }
                    })
                    console.log(`    -> Linked ${pkgData.clientIds.length} clients`)
                }
            }
        }

        console.log('✅ Migration completed successfully')

    } catch (error) {
        console.error('❌ Migration failed:', error)
    } finally {
        await prisma.$disconnect()
    }
}

migratePackages()
