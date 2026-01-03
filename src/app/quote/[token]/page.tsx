'use client'

import { useRef, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Download, PenTool, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getQuoteByToken, signQuote } from '@/lib/actions/quotes'
import { formatCurrency } from '@/lib/utils'
import { SignaturePad } from '@/components/settings/SignaturePad'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function PublicQuotePage() {
    const params = useParams()
    const token = params.token as string

    const [quote, setQuote] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Signing State
    const [isSigning, setIsSigning] = useState(false)
    const [signatureData, setSignatureData] = useState('')

    useEffect(() => {
        if (token) {
            fetchQuote()
        }
    }, [token])

    const fetchQuote = async () => {
        try {
            const result = await getQuoteByToken(token)
            if (result.success) {
                setQuote(result.data)
            } else {
                setError(result.error || 'Failed to load quote')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleSign = async () => {
        if (!signatureData) {
            toast.error('נא לחתום לפני האישור')
            return
        }

        try {
            setIsSigning(true)
            const result = await signQuote(token, signatureData)
            if (result.success) {
                toast.success('ההצעה אושרה בהצלחה!')
                fetchQuote() // Reload to show signed state
            } else {
                toast.error('שגיאה בשמירת החתימה')
            }
        } catch (err) {
            toast.error('שגיאה בשמירת החתימה')
        } finally {
            setIsSigning(false)
        }
    }

    const handleDownloadPDF = async () => {
        const element = document.getElementById('quote-content')
        if (!element) return

        try {
            toast.info('מכין את קובץ ה-PDF...')

            // Create a temporary container to force desktop layout
            const container = document.createElement('div')
            container.style.position = 'absolute'
            container.style.left = '-9999px'
            container.style.top = '0'
            container.style.width = '1200px' // Force desktop width to trigger md: styles

            // Clone the element
            const clone = element.cloneNode(true) as HTMLElement
            container.appendChild(clone)
            document.body.appendChild(container)

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 1200 // Ensure media queries match desktop
            })

            // Cleanup
            document.body.removeChild(container)

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            const pageHeight = 297
            let imgWidth = 210
            let imgHeight = (canvas.height * imgWidth) / canvas.width

            // Scale to fit if slightly bigger than A4 or just to be safe
            // We scale down to pageHeight - 30mm to ensure bottom margin/footer isn't cut
            if (imgHeight > pageHeight - 30) {
                const scale = (pageHeight - 30) / imgHeight
                imgWidth *= scale
                imgHeight = (pageHeight - 30)
            }

            let heightLeft = imgHeight
            let position = 0

            // Center horizontally if scaled down
            const xOffset = (210 - imgWidth) / 2

            pdf.addImage(imgData, 'PNG', xOffset, position, imgWidth, imgHeight)
            heightLeft -= pageHeight

            // Handle multi-page (only if still huge overflow)
            while (heightLeft > 5) {
                position = heightLeft - imgHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', xOffset, position, imgWidth, imgHeight)
                heightLeft -= pageHeight
            }

            pdf.save(`quote_${quote.quoteNumber}.pdf`)
            toast.success('הורדה הושלמה')
        } catch (err) {
            console.error(err)
            toast.error('שגיאה ביצירת ה-PDF')
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        )
    }

    if (error || !quote) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 text-red-500">
                {error || 'הצעת המחיר לא נמצאה'}
            </div>
        )
    }

    const business = quote.user?.businessProfile
    const client = quote.client

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm print:hidden gap-4">
                    <h1 className="text-xl font-bold text-gray-800">הצעת מחיר לאישור</h1>
                    {quote.isSigned && (
                        <Button onClick={handleDownloadPDF} variant="outline" className="gap-2 w-full sm:w-auto">
                            <Download className="h-4 w-4" />
                            הורד PDF
                        </Button>
                    )}
                </div>

                {/* Quote Content - This gets printed/PDF'd */}
                <Card id="quote-content" className="p-4 md:p-8 md:pb-24 bg-white shadow-lg print:shadow-none min-h-[1000px] flex flex-col justify-between">
                    {/* Header */}
                    {/* Main Layout: Header & Client Info vs Business Info */}
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8 gap-8">
                        {/* Right Side (RTL): Quote Details & Client Info */}
                        <div className="w-full md:w-1/2 space-y-8 text-center md:text-start">
                            {/* Quote Details */}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-light text-green-600 mb-2">הצעת מחיר</h1>
                                <div className="text-gray-600">
                                    <p><strong>מספר הצעה:</strong> {quote.quoteNumber}</p>
                                    <p><strong>תאריך:</strong> {new Date(quote.issueDate).toLocaleDateString('he-IL')}</p>
                                    {quote.validUntil && <p><strong>בתוקף עד:</strong> {new Date(quote.validUntil).toLocaleDateString('he-IL')}</p>}
                                </div>
                            </div>

                            {/* Client Info */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">לכבוד</h3>
                                <div className="text-gray-900 font-medium text-lg">{client?.name}</div>
                                {client?.taxId && <div className="text-gray-600">ח.פ / ת.ז: {client.taxId}</div>}
                                {client?.address && <div className="text-gray-600">{client.address}</div>}
                                {client?.email && <div className="text-gray-600">{client.email}</div>}
                            </div>
                        </div>

                        {/* Left Side (RTL): Business Info */}
                        <div className="text-center w-full md:w-auto">
                            {business?.logoUrl && (
                                <div className="mb-4 flex justify-center">
                                    <Image
                                        src={business.logoUrl}
                                        alt="Logo"
                                        width={120}
                                        height={60}
                                        className="object-contain"
                                        unoptimized
                                    />
                                </div>
                            )}
                            <h2 className="text-2xl font-bold text-gray-900">{business?.companyName || 'שם העסק'}</h2>
                            <p className="text-gray-500">{business?.vatStatus === 'AUTHORIZED' ? 'עוסק מורשה' : 'ע.מ'} {business?.companyId}</p>
                            <div className="text-sm text-gray-500 mt-2">
                                {business?.address && <p>{business.address}</p>}
                                {business?.phone && <p>{business.phone}</p>}
                                {business?.email && <p>{business.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Line Items - Placeholder since Quotes usually don't have detailed line items in DB yet, but if they do we map them. 
                        In the current schema we have `items: any[]` in the interface but no relation in schema yet? 
                        Wait, checking Invoice, it has `InvoiceLineItem`. Quote has `items` in interface but let's check schema.
                        Schema `Quote` does NOT have line items relation. 
                        However, the user wants it "EXACTLY LIKE INVOICE".
                        But the quote data structure might optionally typically have a single amount or description.
                        Given I haven't added `QuoteLineItem` to schema, I'll rely on `notes` or just show the total.
                        BUT, to be "exactly like invoice" usually implies functionality. 
                        The user asked to "Apply same thing" referring to the public page design and functionality (signing).
                        I will replicate the structure. If line items are missing in DB, I will hide the table or show a generic one.
                        Actually, `Quote` in `quotes.ts` interface has `items: any[]`, but schema doesn't support it.
                        I'll skip the table for now and focus on the requested design elements if no items exist.
                        Or better, since I can't add a table without data, I will just show the totals.
                    */}

                    {/* Totals - Green Gradient Box */}
                    <div className="flex justify-center mb-12">
                        <div className="w-[90%] bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl p-6 shadow-md">
                            <div className="space-y-3">
                                <div className="flex justify-between text-emerald-50 font-medium">
                                    <span>סכום לפני מע"מ:</span>
                                    <span>{formatCurrency(quote.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-50 font-medium">
                                    <span>מע"מ ({quote.vatRate * 100}%):</span>
                                    <span>{formatCurrency(quote.vatAmount)}</span>
                                </div>
                                <div className="border-t border-emerald-400 my-2"></div>
                                <div className="flex justify-between text-2xl font-bold">
                                    <span>סה"כ לתשלום:</span>
                                    <span>{formatCurrency(quote.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {quote.notes && (
                        <div className="mb-12 p-4 bg-gray-50 rounded text-sm text-gray-600">
                            <strong>הערות:</strong> {quote.notes}
                        </div>
                    )}

                    {/* Signature Area */}
                    <div className="mt-8 border-t pt-8 break-inside-avoid">
                        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-8 md:gap-0">
                            {/* Business Signature */}
                            <div className="text-center">
                                {business?.signatureUrl ? (
                                    <div className="mb-2">
                                        <Image
                                            src={business.signatureUrl}
                                            alt="חתימת העסק"
                                            width={150}
                                            height={60}
                                            className="object-contain mx-auto"
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <div className="h-16 mb-2"></div>
                                )}
                                <div className="border-t border-gray-300 w-48 mt-2 pt-2 text-sm text-gray-500">
                                    חתימת המפיק
                                </div>
                            </div>

                            {/* Client Signature */}
                            <div className="text-center">
                                {quote.isSigned && quote.signature ? (
                                    <div className="mb-2">
                                        <img
                                            src={quote.signature}
                                            alt="חתימת הלקוח"
                                            className="h-16 object-contain mx-auto"
                                        />
                                        <p className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            אושר דיגיטלית ב-{format(new Date(quote.signedAt), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                ) : (
                                    !isSigning && (
                                        <div className="h-16 flex items-center justify-center text-gray-400 text-sm italic mb-2">
                                            ממתין לאישור...
                                        </div>
                                    )
                                )}
                                <div className="border-t border-gray-300 w-48 mt-2 pt-2 text-sm text-gray-500">
                                    חתימת הלקוח (אישור)
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Powered by */}
                    <div className="mt-16 pt-8 text-center text-gray-400 text-xs pb-12 print:pb-0">
                        <p className="mb-2">הופק על ידי</p>
                        <div className="flex justify-center items-center gap-1 opacity-50 grayscale hover:grayscale-0 transition-all">
                            <Image
                                src="/logo.png"
                                alt="Budget Manager"
                                width={120}
                                height={40}
                                className="object-contain h-8 w-auto"
                            />
                        </div>
                    </div>
                </Card>

                {/* Signing Pad (Only if not signed) */}
                {!quote.isSigned && (
                    <Card className="p-6 bg-white shadow-md print:hidden">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-green-600" />
                            אישור הצעת מחיר
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            אנא חתום בתיבה למטה ולחץ על "אשר הצעה" כדי לאשר את הצעת המחיר.
                        </p>

                        <div className="mb-4 touch-none">
                            <SignaturePad
                                value={signatureData}
                                onChange={setSignatureData}
                                onClear={() => setSignatureData('')}
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button onClick={handleSign} disabled={isSigning || !signatureData} className="flex-1 bg-green-600 hover:bg-green-700">
                                {isSigning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        שומר...
                                    </>
                                ) : 'אשר הצעה'}
                            </Button>

                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
