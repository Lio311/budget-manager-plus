
import { prisma } from './src/lib/db';

async function checkVatStatus() {
    const user = await prisma.user.findFirst({
        include: {
            businessProfile: true
        }
    });

    console.log('User found:', user?.email);
    console.log('Business Profile:', user?.businessProfile);
    console.log('VAT Status:', user?.businessProfile?.vatStatus);
}

checkVatStatus()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
