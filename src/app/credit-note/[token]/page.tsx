import { getCreditNoteByToken } from '@/lib/actions/credit-notes'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default async function PublicCreditNotePage({ params }: { params: { token: string } }) {
    const result = await getCreditNoteByToken(params.token)

    if (!result.success || !result.data) {
        notFound()
    }

    const creditNote = result.data
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
                    <h1 className="text-xl font-bold text-gray-800">חשבונית זיכוי</h1>
                    <Button
                        onClick={() => window.print()}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                        <Download className="h-4 w-4" />
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
                                <h2 className="text-3xl font-bold text-orange-600 mb-2">חשבונית זיכוי</h2>
                                <div className="space-y-1 text-gray-600">
                                    <p><span className="font-semibold">מספר:</span> {creditNote.creditNoteNumber}</p>
                                    <p><span className="font-semibold">תאריך הנפקה:</span> {format(new Date(creditNote.issueDate), 'dd/MM/yyyy')}</p>
                                    <p><span className="font-semibold">חשבונית מקורית:</span> {invoice?.invoiceNumber}</p>
                                </div>
                            </div>

                            {/* Client Info */}
                            {client && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-bold text-gray-700 mb-2">ללקוח:</h3>
                                    <div className="text-gray-600 space-y-1">
                                        <p className="font-semibold">{client.name}</p>
                                        {client.email && <p>{client.email}</p>}
                                        {client.phone && <p>{client.phone}</p>}
                                        {client.address && <p>{client.address}</p>}
                                        {client.taxId && <p>ח.פ/ע.מ: {client.taxId}</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Left Side: Business Info */}
                        <div className="w-full md:w-1/2 text-center md:text-start">
                            {business ? (
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-gray-800">{business.companyName}</h3>
                                    <div className="text-gray-600 space-y-1">
                                        {business.address && <p>{business.address}</p>}
                                        {business.phone && <p>טלפון: {business.phone}</p>}
                                        {business.email && <p>אימייל: {business.email}</p>}
                                        {business.companyId && <p>ח.פ: {business.companyId}</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-gray-500">
                                    <p>פרטי עסק לא זמינים</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reason */}
                    {creditNote.reason && (
                        <div className="mb-8">
                            <h3 className="font-bold text-gray-700 mb-2">סיבת הזיכוי:</h3>
                            <p className="text-gray-600">{creditNote.reason}</p>
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

                    {/* Business Signature */}
                    {business?.signatureUrl && (
                        <div className="mt-auto pt-8 border-t border-gray-200">
                            <div className="flex flex-col items-center gap-2">
                                <img
                                    src={business.signatureUrl}
                                    alt="חתימה"
                                    className="h-16 object-contain"
                                />
                                <p className="text-sm text-gray-500">חתימת העסק</p>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
