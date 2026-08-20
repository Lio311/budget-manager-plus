
import { prisma } from './src/lib/db';

async function checkAllProfiles() {
    const users = await prisma.user.findMany({
        include: {
            businessProfile: true
        }
    });

    console.log(`Found ${users.length} users.`);
    users.forEach(u => {
        console.log(`User: ${u.email} (${u.id})`);
        console.log(`  Profile:`, u.businessProfile ? 'EXISTS' : 'NULL');
        if (u.businessProfile) {
            console.log(`  VAT Status: ${u.businessProfile.vatStatus}`);
        }
    });
}

checkAllProfiles()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
