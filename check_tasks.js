
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const tasks = await prisma.projectTask.findMany({
            take: 20,
        });
        console.log('Total tasks found:', tasks.length);
        if (tasks.length > 0) {
            console.log('Sample tasks assignees:', tasks.map(t => ({ id: t.id, status: t.status, assignees: t.assignees })));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
