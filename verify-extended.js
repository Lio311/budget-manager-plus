
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyExtended() {
    // Fetch a real user ID from the DB
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
        console.error('No users found in database to run verification.');
        return;
    }
    const userId = firstUser.id;
    const testClientName = 'Extended Test Client';
    
    try {
        // 1. Create a test client
        const client = await prisma.client.create({
            data: {
                userId,
                name: testClientName,
                isActive: true,
                isDeleted: false,
                scope: 'BUSINESS'
            }
        });
        console.log('Created client:', client.id);

        // 2. Create an invoice and credit note
        const invoice = await prisma.invoice.create({
            data: {
                userId,
                clientId: client.id,
                invoiceNumber: 'INV-VERIFY-EXT',
                subtotal: 100,
                vatAmount: 17,
                total: 117,
                status: 'PAID',
                invoiceType: 'INVOICE'
            }
        });
        
        const creditNote = await prisma.creditNote.create({
            data: {
                userId,
                invoiceId: invoice.id,
                creditNoteNumber: 'CN-VERIFY-EXT',
                creditAmount: 50,
                vatAmount: 8.5,
                totalCredit: 58.5,
                scope: 'BUSINESS'
            }
        });

        // 3. Import the actions to test
        // Note: Since these are 'use server' actions, we might need to mock auth() if we run them directly.
        // Instead, we will simulate the logic by running the same Prisma queries.
        
        const checkVisibility = async (isActive, isDeleted) => {
            await prisma.client.update({
                where: { id: client.id },
                data: { isActive, isDeleted }
            });

            const creditNotesCount = await prisma.creditNote.count({
                where: {
                    userId,
                    invoice: {
                        OR: [
                            { clientId: null },
                            { client: { isActive: true, isDeleted: false } }
                        ]
                    }
                }
            });

            return creditNotesCount;
        };

        console.log('Initial visibility count:', await checkVisibility(true, false));
        console.log('Hidden client count:', await checkVisibility(false, false));
        console.log('Deleted client count:', await checkVisibility(true, true));

        // Cleanup
        await prisma.creditNote.delete({ where: { id: creditNote.id } });
        await prisma.invoice.delete({ where: { id: invoice.id } });
        await prisma.client.delete({ where: { id: client.id } });
        console.log('Cleanup complete.');

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyExtended();
