'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getCreditNoteByToken } from '@/lib/actions/credit-notes'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, ArrowRight, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { toast } from 'sonner'

export default function PublicCreditNotePage() {
    const params = useParams()
    const token = params.token as string
    const [creditNote, setCreditNote] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isDownloading, setIsDownloading] = useState(false)

    const handleDownloadPDF = async () => {
        const element = document.getElementById('credit-note-content')
        if (!element) return

        try {
            setIsDownloading(true)
            toast.info('מכין PDF להורדה...')

            // Create a hidden container for higher resolution rendering
            const container = document.createElement('div')
            container.style.position = 'absolute'
            container.style.left = '-9999px'
            container.style.top = '0'
            container.style.width = '1200px'

            // Clone the element
            const clone = element.cloneNode(true) as HTMLElement
            container.appendChild(clone)
            document.body.appendChild(container)

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 1200
            })

            // Cleanup
            document.body.removeChild(container)

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            })

            let imgWidth = 210
            const pageHeight = 297
            let imgHeight = (canvas.height * imgWidth) / canvas.width

            if (imgHeight > pageHeight - 30) {
                const scale = (pageHeight - 30) / imgHeight
                imgWidth *= scale
                imgHeight = (pageHeight - 30)
            }

            const xOffset = (210 - imgWidth) / 2
            pdf.addImage(imgData, 'PNG', xOffset, 0, imgWidth, imgHeight)

            pdf.save(`credit_note_${creditNote.creditNoteNumber}.pdf`)
            toast.success('הורדה הושלמה')
        } catch (err) {
            console.error(err)
            toast.error('שגיאה ביצירת PDF')
        } finally {
            setIsDownloading(false)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const result = await getCreditNoteByToken(token)
            if (!result.success || !result.data) {
                notFound()
            }
            setCreditNote(result.data)
            setLoading(false)
        }
        fetchData()
    }, [token])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <Loader2 className="h-10 w-10 text-green-600 animate-spin mb-4" />
                <p className="text-gray-500 animate-pulse font-medium">טוען את פרטי הזיכוי...</p>
            </div>
        )
    }

    if (!creditNote) {
        notFound()
    }
    const business = creditNote.user?.businessProfile
    const invoice = creditNote.invoice
    const client = invoice?.client

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 2
        }).format(amount)
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-lg shadow-sm print:hidden gap-4">
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => window.history.back()}
                            variant="ghost"
                            size="icon"
                            className="md:hidden text-gray-500 hover:text-gray-900"
                        >
                            <ArrowRight className="h-6 w-6" />
                        </Button>
                        <h1 className="text-xl font-bold text-gray-800">חשבונית זיכוי</h1>
                    </div>
                    <Button
                        onClick={handleDownloadPDF}
                        disabled={isDownloading}
                        variant="outline"
                        className="gap-2 w-full sm:w-auto"
                    >
                        {isDownloading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4" />
                        )}
                        הורד PDF
                    </Button>
                </div>

                {/* Credit Note Content */}
                <Card id="credit-note-content" className="p-4 md:p-8 bg-white shadow-lg print:shadow-none min-h-[1000px] flex flex-col justify-between">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8 gap-8">
                        {/* Right Side: Credit Note Details & Client Info */}
                        <div className="w-full md:w-1/2 space-y-8 text-center md:text-start">
                            {/* Credit Note Details */}
                            <div>
                                <h1 className="text-3xl md:text-4xl font-light text-green-600 mb-2">חשבונית זיכוי</h1>
                                <div className="text-gray-600">
                                    <p><strong>מספר:</strong> {creditNote.creditNoteNumber}</p>
                                    <p><strong>תאריך הנפקה:</strong> {format(new Date(creditNote.issueDate), 'dd/MM/yyyy')}</p>
                                    <p><strong>חשבונית מקורית:</strong> {invoice?.invoiceNumber}</p>
                                </div>
                            </div>

                            {/* Client Info */}
                            {client && (
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">לכבוד</h3>
                                    <div className="text-gray-900 font-medium text-lg">{client.name}</div>
                                    {client.taxId && <div className="text-gray-600">ח.פ / ת.ז: {client.taxId}</div>}
                                    {client.address && <div className="text-gray-600">{client.address}</div>}
                                    {client.email && <div className="text-gray-600">{client.email}</div>}
                                </div>
                            )}
                        </div>

                        {/* Left Side: Business Info */}
                        <div className="text-center w-full md:w-auto">
                            {business?.logoUrl && (
                                <div className="mb-4 flex justify-center">
                                    <img
                                        src={business.logoUrl}
                                        alt="Logo"
                                        className="h-16 object-contain"
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

                    {/* Reason */}
                    {creditNote.reason && (
                        <div className="mb-8">
                            <h3 className="font-bold text-gray-700 mb-2 border-b-2 border-gray-100 pb-2">סיבת הזיכוי:</h3>
                            <p className="text-gray-600 mt-4">{creditNote.reason}</p>
                        </div>
                    )}

                    {/* Totals - Green Gradient Box */}
                    <div className="flex justify-center mb-12">
                        <div className="w-[90%] bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 shadow-md">
                            <div className="space-y-3">
                                <div className="flex justify-between text-green-50 font-medium">
                                    <span>סכום לפני מע"מ:</span>
                                    <span>{formatCurrency(creditNote.creditAmount)}</span>
                                </div>
                                <div className="flex justify-between text-green-50 font-medium">
                                    <span>מע"מ ({(invoice?.vatRate || 0.18) * 100}%):</span>
                                    <span>{formatCurrency(creditNote.vatAmount)}</span>
                                </div>
                                <div className="h-px bg-white/30"></div>
                                <div className="flex justify-between text-white text-xl font-bold">
                                    <span>סה"כ זיכוי:</span>
                                    <span>{formatCurrency(creditNote.totalCredit)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Produced by */}
                    <div className="mt-16 pt-8 text-center text-gray-400 text-xs pb-12 print:pb-0 border-t border-gray-100 flex items-center justify-center gap-2">
                        <span>הופק על ידי</span>
                        <div className="flex justify-center items-center opacity-50 grayscale hover:grayscale-0 transition-all">
                            <img
                                src="/images/branding/K-LOGO.png"
                                alt="Budget Manager"
                                className="object-contain h-8 w-auto"
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
