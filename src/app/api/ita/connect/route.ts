import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(req: Request) {
    const { userId } = await auth()
    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const clientId = process.env.ITA_CLIENT_ID
    if (!clientId) {
        return new NextResponse('ITA_CLIENT_ID is not configured', { status: 500 })
    }

    // Redirect user to ITA OAuth page
    // Note: This is the sandbox URL. In production, change to the real ITA URL.
    const authorizeUrl = new URL('https://openapi.taxes.gov.il/shaam/tsandbox/longtimetoken/oauth2/authorize')
    authorizeUrl.searchParams.append('response_type', 'code')
    authorizeUrl.searchParams.append('client_id', clientId)
    authorizeUrl.searchParams.append('scope', 'scope') // specific scope required by ITA

    return NextResponse.redirect(authorizeUrl.toString())
}
