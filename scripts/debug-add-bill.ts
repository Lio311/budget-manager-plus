
import { addBill, getBills } from '@/lib/actions/bill';
import { prisma } from '@/lib/db';

async function testAddBillLeakage() {
    console.log('--- Starting Add Bill Leakage Test ---');

    // 1. Define test parameters
    const month = 12;
    const year = 2025;
    const type = 'BUSINESS';
    const billName = 'Test Business Bill ' + Date.now();
    const billAmount = 123.45;
    const billDueDay = 15;

    console.log(`Adding bill: ${billName} to ${type} budget for ${month}/${year}`);

    // 2. Call the server action directly (backend simulation)
    const result = await addBill(month, year, {
        name: billName,
        amount: billAmount,
        currency: 'ILS',
        dueDay: billDueDay
    }, type);

    if (!result.success) {
        console.error('Failed to add bill:', result.error);
        return;
    }

    // 3. Verify where it landed
    const bill = await prisma.bill.findUnique({
        where: { id: createdBillId },
        include: { budget: true }
    });

    if (!bill) {
        console.error('Bill not found in DB!');
        return;
    }

    console.log(`Bill Budget Type: ${bill.budget.type}`);
    console.log(`Bill Budget ID: ${bill.budget.id}`);

    if (bill.budget.type === 'BUSINESS') {
        console.log('✅ SUCCESS: Bill was added to BUSINESS budget.');
    } else {
        console.error('❌ FAILURE: Bill was added to PERSONAL budget (Leak Detected!).');
    }

    // 4. Cleanup
    console.log('Cleaning up test bill...');
    await prisma.bill.delete({ where: { id: createdBillId } });
    console.log('Cleanup complete.');
}

testAddBillLeakage()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
