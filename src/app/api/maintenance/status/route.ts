import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { ADMIN_EMAILS } from "@/lib/constants";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        const config = await prisma.siteConfig.findUnique({
            where: { id: 'default' }
        });

        const enabled = config?.maintenanceMode || false;
        let isAdmin = false;

        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { email: true }
            });

            if (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
                isAdmin = true;
            }
        }

        return NextResponse.json({
            enabled,
            isAdmin
        });
    } catch (error) {
        console.error('Maintenance status API error:', error);
        return NextResponse.json({ enabled: false, isAdmin: false }, { status: 500 });
    }
}
