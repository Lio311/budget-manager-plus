import { Resend } from 'resend'

let resendInstance: Resend | null = null

function getResend() {
    if (!resendInstance) {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) {
            console.warn('⚠️ RESEND_API_KEY not set, emails will not be sent')
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
            console.log('❌ Email not sent (no API key):', { to, subject })
            return { success: false, error: 'Email service not configured' }
        }

        // Use the verified domain email from Resend
        const fromEmail = process.env.FROM_EMAIL || 'Kesefly <noreply@kesefly.co.il>'

        console.log('📧 Sending email:', { from: fromEmail, to, subject })

        const result = await resend.emails.send({
            from: fromEmail,
            to,
            subject,
            html
        })

        console.log('✅ Email sent successfully:', result)
        return { success: true, data: result }
    } catch (error) {
        console.error('❌ Email sending error:', error)
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
}
