import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixClientPhones() {
    try {
        const clients = await prisma.client.findMany({
            where: {
                NOT: {
                    phone: null
                }
            }
        })

        console.log(`Found ${clients.length} clients to check...`)
        let updatedCount = 0

        for (const client of clients) {
            if (!client.phone) continue

            let newPhone = client.phone.trim()
            let isChanged = false

            // 1. Add prefix if missing (default to +972)
            // But be careful not to double prefix or break international
            if (!newPhone.startsWith('+')) {
                // If it looks like a valid local number (starts with 0)
                // e.g. 050123... -> +972 050123...
                newPhone = `+972 ${newPhone}`
                isChanged = true
            } else {
                // 2. Ensure space after +972
                // e.g. +972050... -> +972 050...
                // Regex: Starts with +972 AND next char is digit (not space)
                if (/^\+972\d/.test(newPhone)) {
                    newPhone = newPhone.replace('+972', '+972 ')
                    isChanged = true
                }
            }

            if (isChanged) {
                console.log(`Updating client ${client.name}: ${client.phone} -> ${newPhone}`)
                await prisma.client.update({
                    where: { id: client.id },
                    data: { phone: newPhone }
                })
                updatedCount++
            }
        }

        console.log(`Finished. Updated ${updatedCount} clients.`)

    } catch (error) {
        console.error('Error fixing phones:', error)
    } finally {
        await prisma.$disconnect()
    }
}

fixClientPhones()
