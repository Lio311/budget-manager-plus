'use server'

import { z } from 'zod'

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

        // TODO: In production, integrate with email service (e.g., Resend, SendGrid)
        // For now, log to console
        console.log('📧 Contact Form Submission:', {
            from: validated.email,
            name: validated.name,
            subject: validated.subject,
            message: validated.message,
            timestamp: new Date().toISOString(),
        })

        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 500))

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
