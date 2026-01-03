import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/google'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: NextRequest) {
    const { userId } = auth()
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = getAuthUrl()
    if (!url) {
        return NextResponse.json(
            { error: 'Google Client ID/Secret not configured' },
            { status: 500 }
        )
    }

    // Redirect user to Google Auth
    return NextResponse.redirect(url)
}
