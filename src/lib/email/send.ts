import { Resend } from 'resend'

let resendInstance: Resend | null = null

function getResend() {
    if (!resendInstance) {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) {
            console.warn('RESEND_API_KEY not set, emails will not be sent')
            return null
        }
        resendInstance = new Resend(apiKey)
    }
    return resendInstance
}

export async function sendEmail(to: string, subject: string, html: string) {
    try {
        const resend = getResend()
        if (!resend) {
            console.log('Email not sent (no API key):', { to, subject })
            return { success: false, error: 'No API key' }
        }

        await resend.emails.send({
            from: process.env.FROM_EMAIL || 'Budget Manager <noreply@budgetmanager.com>',
            to,
            subject,
            html
        })
        return { success: true }
    } catch (error) {
        console.error('Email error:', error)
        return { success: false, error }
    }
}
