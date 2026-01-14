'use server'

import { z } from 'zod'
import { sendEmail } from '@/lib/email/send'

const contactFormSchema = z.object({
    name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
    email: z.string().email('כתובת אימייל לא תקינה'),
    subject: z.string().min(3, 'נושא חייב להכיל לפחות 3 תווים'),
    message: z.string().min(10, 'הודעה חייבת להכיל לפחות 10 תווים'),
})

export async function submitContactForm(formData: FormData) {
    try {
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            subject: formData.get('subject') as string,
            message: formData.get('message') as string,
        }

        // Validate
        const validated = contactFormSchema.parse(data)

        // Create email HTML
        const emailHtml = `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981; margin-bottom: 20px;">פנייה חדשה מאתר KeseFly</h2>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 10px 0;"><strong>שם:</strong> ${validated.name}</p>
                    <p style="margin: 10px 0;"><strong>אימייל:</strong> <a href="mailto:${validated.email}">${validated.email}</a></p>
                    <p style="margin: 10px 0;"><strong>נושא:</strong> ${validated.subject}</p>
                </div>
                <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h3 style="color: #374151; margin-top: 0;">הודעה:</h3>
                    <p style="white-space: pre-wrap; line-height: 1.6;">${validated.message}</p>
                </div>
                <p style="color: #6b7280; font-size: 12px; margin-top: 20px; text-align: center;">
                    נשלח ב-${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
                </p>
            </div>
        `

        console.log('🔄 Attempting to send email to info@kesefly.co.il...')

        // Send email to business
        const result = await sendEmail(
            'info@kesefly.co.il',
            `פנייה חדשה: ${validated.subject}`,
            emailHtml
        )

        console.log('📬 Email send result:', result)

        if (!result.success) {
            console.error('❌ Failed to send contact email:', result.error)

            // Log for backup even on failure
            console.log('📧 Contact Form Submission (Email Failed):', {
                from: validated.email,
                name: validated.name,
                subject: validated.subject,
                timestamp: new Date().toISOString(),
            })

            return {
                success: false,
                message: 'אירעה שגיאה בשליחת המייל. אנא נסה שוב או שלח ישירות ל-info@kesefly.co.il',
            }
        }

        // Log for backup on success
        console.log('📧 Contact Form Submission (Success):', {
            from: validated.email,
            name: validated.name,
            subject: validated.subject,
            timestamp: new Date().toISOString(),
        })

        return {
            success: true,
            message: 'הודעתך נשלחה בהצלחה! נחזור אליך בהקדם.',
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: error.errors[0].message,
            }
        }

        console.error('Contact form error:', error)
        return {
            success: false,
            message: 'אירעה שגיאה בשליחת ההודעה. אנא נסה שוב מאוחר יותר.',
        }
    }
}
