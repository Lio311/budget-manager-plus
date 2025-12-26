import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const config = await prisma.siteConfig.findUnique({
            where: { id: 'default' }
        });

        return NextResponse.json({
            enabled: config?.maintenanceMode || false
        });
    } catch (error) {
        return NextResponse.json({ enabled: false }, { status: 500 });
    }
}
