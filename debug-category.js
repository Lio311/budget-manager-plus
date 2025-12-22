
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAddCategory() {
    console.log('Testing category model keys:', Object.keys(prisma).filter(k => !k.startsWith('_')));

    try {
        // Mock user ID (using the one from the DB we found earlier)
        const userId = 'user_37D58cvD1Et15KkdOhWChL9hE7N';

        console.log('Checking if user exists:', userId);
        const user = await prisma.user.findUnique({ where: { id: userId } });
        console.log('User status:', user ? 'Found' : 'Not Found');

        if (!user) {
            console.log('Creating user...');
            await prisma.user.create({ data: { id: userId, email: 'lior31197@gmail.com' } });
        }

        console.log('Attempting to add category...');
        // Explicitly check for 'category' property
        if (!prisma.category) {
            console.error('Error: prisma.category is UNDEFINED');
            return;
        }

        const result = await prisma.category.create({
            data: {
                userId: userId,
                name: 'Debug Category ' + Date.now(),
                type: 'income',
                color: 'bg-blue-100',
                updatedAt: new Date()
            }
        });

        console.log('Success!', result);
    } catch (err) {
        console.error('CRASH:', err);
    } finally {
        await prisma.$disconnect();
    }
}

debugAddCategory();
