const { validateCoupon } = require('./src/lib/actions/subscription');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCoupon() {
    try {
        const code = 'RON20';
        const email = 'lior31197@gmail.com'; // Testing with admin email for now, or use a dummy one if needed
        console.log(`Testing coupon: ${code} for email: ${email}`);

        // First check if coupon exists directly
        const coupon = await prisma.coupon.findUnique({ where: { code } });
        console.log('Coupon found in DB:', coupon);

        if (coupon) {
            const result = await validateCoupon(code, email);
            console.log('Validation Result:', result);
        } else {
            console.log('Coupon RON20 does not exist in the database.');
        }

    } catch (error) {
        console.error('Error testing coupon:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testCoupon();
