import { google } from 'googleapis'
import { authenticatedPrisma } from './db'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

// Use environment variables for OAuth credentials
// In production, these should be set in Vercel/Render
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/calendar/callback`

export const getOAuth2Client = () => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        return null // Should handle this gracefully in UI (show instruction)
    }

    return new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    )
}

export const getAuthUrl = () => {
    const oauth2Client = getOAuth2Client()
    if (!oauth2Client) return null

    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Critical for getting refresh token
        scope: SCOPES,
        prompt: 'consent' // Force consent to ensure refresh token is returned
    })
}

export const getGoogleCalendarClient = async (userId: string) => {
    const db = await authenticatedPrisma(userId)
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { googleCalendarRefreshToken: true }
    })

    if (!user?.googleCalendarRefreshToken) {
        return null
    }

    const oauth2Client = getOAuth2Client()
    if (!oauth2Client) return null

    oauth2Client.setCredentials({
        refresh_token: user.googleCalendarRefreshToken
    })

    return google.calendar({ version: 'v3', auth: oauth2Client })
}
