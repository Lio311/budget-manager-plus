import { NextRequest, NextResponse } from 'next/server'
import { getOAuth2Client } from '@/lib/google'
import { auth } from '@clerk/nextjs/server'
import { authenticatedPrisma } from '@/lib/db'

export async function GET(req: NextRequest) {
    const { userId } = await auth()
    if (!userId) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error || !code) {
        return NextResponse.redirect(new URL('/dashboard?error=google_auth_failed', req.url))
    }

    try {
        const oauth2Client = getOAuth2Client()
        if (!oauth2Client) {
            throw new Error('OAuth client not configured')
        }

        const { tokens } = await oauth2Client.getToken(code)

        if (!tokens.refresh_token) {
            // Note: If user previously authorized and we lost the token, Google might not send a new refresh token unless prompt='consent' is used.
            // Our getAuthUrl uses prompt='consent'.
            console.warn('No refresh token received from Google')
        }

        const db = await authenticatedPrisma(userId)

        await db.user.update({
            where: { id: userId },
            data: {
                googleCalendarRefreshToken: tokens.refresh_token, // Might be undefined if not returned but should be there with prompt=consent
                isCalendarSyncEnabled: true
            }
        })

        return NextResponse.redirect(new URL('/dashboard?success=calendar_connected', req.url))
    } catch (err) {
        console.error('Google Auth Callback Error:', err)
        return NextResponse.redirect(new URL('/dashboard?error=calendar_connection_failed', req.url))
    }
}
