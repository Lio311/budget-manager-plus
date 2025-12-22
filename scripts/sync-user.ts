import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncUser() {
    // Replace with your actual Clerk user ID and email
    const clerkId = 'user_J791_rESdSO61z'
    const email = 'lior.31167@gmail.com'

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: clerkId }
        })

        if (existingUser) {
            console.log('✅ User already exists:', existingUser)
        } else {
            // Create user
            const newUser = await prisma.user.create({
                data: {
                    id: clerkId,
                    email
                }
            })
            console.log('✅ User created successfully:', newUser)
        }
    } catch (error) {
        console.error('❌ Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

syncUser()
