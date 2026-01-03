'use client'

import { useRef, useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Download, PenTool, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getInvoiceByToken, signInvoice } from '@/lib/actions/invoices'
import { formatCurrency } from '@/lib/utils'
import { SignaturePad } from '@/components/settings/SignaturePad'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function PublicInvoicePage() {
    const params = useParams()
    const token = params.token as string

    const [invoice, setInvoice] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Signing State
    const [isSigning, setIsSigning] = useState(false)
    const [signatureData, setSignatureData] = useState('')

    useEffect(() => {
        if (token) {
            fetchInvoice()
        }
    }, [token])

    const fetchInvoice = async () => {
        try {
            const result = await getInvoiceByToken(token)
            if (result.success) {
                setInvoice(result.data)
            } else {
                setError(result.error || 'Failed to load invoice')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleSign = async () => {
        if (!signatureData) {
            toast.error('נא לחתום לפני השמירה')
            return
        }

        try {
            setIsSigning(true)
            const result = await signInvoice(token, signatureData)
            if (result.success) {
                toast.success('החתימה נשמרה בהצלחה!')
                fetchInvoice() // Reload to show signed state
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
        const element = document.getElementById('invoice-content')
        if (!element) return

        try {
            toast.info('מכין את קובץ ה-PDF...')

            // Use html2canvas to capture the element
            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                useCORS: true, // Allow loading cross-origin images (like signatures/logos)
                logging: false
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            let imgWidth = 210 // A4 width in mm
            const pageHeight = 297 // A4 height in mm
            let imgHeight = (canvas.height * imgWidth) / canvas.width

            // Scale to fit if slightly bigger than A4 or just to be safe
            // We scale down to pageHeight - 10mm to ensure bottom margin/footer isn't cut
            if (imgHeight > pageHeight - 10) {
                const scale = (pageHeight - 10) / imgHeight
                imgWidth *= scale
                imgHeight = (pageHeight - 10)
            }

            let heightLeft = imgHeight
            let position = 0

            // Center horizontally if scaled down
            const xOffset = (210 - imgWidth) / 2

            pdf.addImage(imgData, 'PNG', xOffset, position, imgWidth, imgHeight)
            heightLeft -= pageHeight

            // Handle multi-page (only if still huge overflow)
            while (heightLeft > 5) { // Threshold to prevent tiny overflows causing new page
                position = heightLeft - imgHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', xOffset, position, imgWidth, imgHeight)
                heightLeft -= pageHeight
            }

            pdf.save(`invoice_${invoice.invoiceNumber}.pdf`)
            toast.success('הורדה הושלמה')
        } catch (err) {
            console.error(err)
            toast.error('שגיאה ביצירת ה-PDF')
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    if (error || !invoice) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 text-red-500">
                {error || 'החשבונית לא נמצאה'}
            </div>
        )
    }

    const business = invoice.user?.businessProfile
    const client = invoice.client

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm print:hidden gap-4">
                    <h1 className="text-xl font-bold text-gray-800">חשבונית לתשלום</h1>
                    {invoice.isSigned && (
                        <Button onClick={handleDownloadPDF} variant="outline" className="gap-2 w-full sm:w-auto">
                            <Download className="h-4 w-4" />
                            הורד PDF
                        </Button>
                    )}
                </div>

                {/* Invoice Content - This gets printed/PDF'd */}
                <Card id="invoice-content" className="p-4 md:p-8 bg-white shadow-lg print:shadow-none">
                    {/* Header */}
                    {/* Header */}
                    {/* Main Layout: Header & Client Info vs Business Info */}
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8 gap-8">
                        {/* Right Side (RTL): Invoice Details & Client Info */}
                        <div className="w-full md:w-1/2 space-y-8 text-center md:text-start">
                            {/* Invoice Details */}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-light text-green-600 mb-2">חשבונית מס</h1>
                                <div className="text-gray-600">
                                    <p><strong>מספר חשבונית:</strong> {invoice.invoiceNumber}</p>
                                    <p><strong>תאריך:</strong> {new Date(invoice.issueDate).toLocaleDateString('he-IL')}</p>
                                    {invoice.dueDate && <p><strong>לתשלום עד:</strong> {new Date(invoice.dueDate).toLocaleDateString('he-IL')}</p>}
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

                    {/* Line Items */}
                    <div className="mb-12">
                        <table className="w-full text-right">
                            <thead className="border-b-2 border-gray-100">
                                <tr>
                                    <th className="py-3 text-sm font-bold text-gray-500">תיאור</th>
                                    <th className="py-3 text-sm font-bold text-gray-500 text-center w-24">כמות</th>
                                    <th className="py-3 text-sm font-bold text-gray-500 text-center w-32">מחיר יח'</th>
                                    <th className="py-3 text-sm font-bold text-gray-500 text-left w-32">סה"כ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {invoice.lineItems?.map((item: any, idx: number) => (
                                    <tr key={idx}>
                                        <td className="py-4 text-gray-900">{item.description}</td>
                                        <td className="py-4 text-gray-600 text-center">{item.quantity}</td>
                                        <td className="py-4 text-gray-600 text-center">{formatCurrency(item.price)}</td>
                                        <td className="py-4 text-gray-900 font-medium text-left">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals - Green Gradient Box */}
                    <div className="flex justify-end mb-12">
                        <div className="w-full md:w-96 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl p-6 shadow-md">
                            <div className="space-y-3">
                                <div className="flex justify-between text-emerald-50 font-medium">
                                    <span>סה"כ לפני מע"מ:</span>
                                    <span>{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-50 font-medium">
                                    <span>מע"מ ({invoice.vatRate * 100}%):</span>
                                    <span>{formatCurrency(invoice.vatAmount)}</span>
                                </div>
                                <div className="border-t border-emerald-400 my-2"></div>
                                <div className="flex justify-between text-2xl font-bold">
                                    <span>סה"כ לתשלום:</span>
                                    <span>{formatCurrency(invoice.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="mb-12 p-4 bg-gray-50 rounded text-sm text-gray-600">
                            <strong>הערות:</strong> {invoice.notes}
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
                                {invoice.isSigned && invoice.signature ? (
                                    <div className="mb-2">
                                        <img
                                            src={invoice.signature}
                                            alt="חתימת הלקוח"
                                            className="h-16 object-contain mx-auto"
                                        />
                                        <p className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                                            <CheckCircle className="h-3 w-3" />
                                            אושר דיגיטלית ב-{format(new Date(invoice.signedAt), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                ) : (
                                    !isSigning && (
                                        <div className="h-16 flex items-center justify-center text-gray-400 text-sm italic mb-2">
                                            ממתין לחתימה...
                                        </div>
                                    )
                                )}
                                <div className="border-t border-gray-300 w-48 mt-2 pt-2 text-sm text-gray-500">
                                    חתימת הלקוח
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col items-center justify-center opacity-70">
                        <span className="text-xs text-gray-400 mb-1">הופק על ידי</span>
                        <Image
                            src="/K-LOGO.png"
                            alt="KeseFlow"
                            width={80}
                            height={32}
                            className="object-contain opacity-80 hover:opacity-100 transition-opacity"
                        />
                    </div>
                </Card>

                {/* Signing Pad (Only if not signed) */}
                {!invoice.isSigned && (
                    <Card className="p-6 bg-white shadow-md print:hidden">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-green-600" />
                            חתימה דיגיטלית
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            אנא חתום בתיבה למטה ולחץ על "אשר חתימה" כדי לאשר את קבלת החשבונית.
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
                                ) : 'אשר חתימה'}
                            </Button>

                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}
