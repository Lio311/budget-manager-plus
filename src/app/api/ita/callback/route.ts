import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { authenticatedPrisma } from '@/lib/db'

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const url = new URL(req.url)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')

        if (error) {
            console.error('ITA OAuth Error:', error)
            return NextResponse.redirect(new URL('/dashboard/settings?ita_error=1', req.url))
        }

        if (!code) {
            return new NextResponse('No authorization code provided', { status: 400 })
        }

        const clientId = process.env.ITA_CLIENT_ID
        const clientSecret = process.env.ITA_CLIENT_SECRET
        // Fallback to localhost if not set in Vercel for testing
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const redirectUri = `${appUrl}/api/ita/callback`

        if (!clientId || !clientSecret) {
            console.error('ITA credentials not configured')
            return NextResponse.redirect(new URL('/dashboard/settings?ita_error=config', req.url))
        }

        // Token Exchange
        // Note: Using sandbox URL. In production, this should switch based on an env variable or config.
        const tokenUrl = 'https://openapi.taxes.gov.il/shaam/tsandbox/longtimetoken/oauth2/token'
        
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            // ITA sometimes requires scope in the token request
            scope: 'scope' // Hardcoded based on PDF docs
        })

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body.toString()
        })

        if (!response.ok) {
            const errText = await response.text()
            console.error('Failed to get token from ITA:', errText)
            return NextResponse.redirect(new URL('/dashboard/settings?ita_error=token', req.url))
        }

        const data = await response.json()
        const refreshToken = data.refresh_token

        if (!refreshToken) {
            console.error('No refresh token received from ITA:', data)
            return NextResponse.redirect(new URL('/dashboard/settings?ita_error=no_refresh', req.url))
        }

        const db = await authenticatedPrisma(userId)
        
        await db.businessProfile.update({
            where: { userId },
            data: { itaRefreshToken: refreshToken }
        })

        // Redirect back to settings with success message
        return NextResponse.redirect(new URL('/dashboard/settings?ita_success=1', req.url))
        
    } catch (error) {
        console.error('ITA callback error:', error)
        return NextResponse.redirect(new URL('/dashboard/settings?ita_error=server', req.url))
    }
}
