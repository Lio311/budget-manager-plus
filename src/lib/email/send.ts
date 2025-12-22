import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string) {
    try {
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
