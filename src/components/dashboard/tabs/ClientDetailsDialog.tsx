'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { getBankName } from '@/lib/constants/israel-data'
import { formatIsraeliPhoneNumber } from '@/lib/utils'
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone, MapPin, Calendar, CreditCard, FileText, Banknote } from "lucide-react"

interface ClientDetailsDialogProps {
    client: any
    isOpen: boolean
    onClose: () => void
}

export function ClientDetailsDialog({ client, isOpen, onClose }: ClientDetailsDialogProps) {
    if (!client) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-right">
                            <DialogTitle className="text-xl">{client.name}</DialogTitle>
                            {client.taxId && (
                                <p className="text-sm text-gray-500 mt-1">ח.פ / ע.מ: {client.taxId}</p>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Status & Package Badges */}
                    <div className="flex flex-wrap gap-2">
                        {client.isActive === false ? (
                            <Badge variant="secondary">לא פעיל</Badge>
                        ) : (
                            <Badge className="bg-green-600 hover:bg-green-700">פעיל</Badge>
                        )}
                        {(client.package?.name || client.packageName) && (
                            <Badge
                                variant="secondary"
                                style={{
                                    backgroundColor: (client.package?.color || client.subscriptionColor || '#3B82F6'),
                                    color: '#ffffff'
                                }}
                            >
                                {client.package?.name || client.packageName}
                            </Badge>
                        )}
                        {client.subscriptionStatus === 'PAID' && <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">שולם</Badge>}
                        {client.subscriptionStatus === 'UNPAID' && <Badge variant="destructive">לא שולם</Badge>}
                        {client.subscriptionStatus === 'PARTIAL' && <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">שולם חלקית</Badge>}
                        {client.subscriptionStatus === 'INSTALLMENTS' && <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">בתשלומים</Badge>}
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">פרטי קשר</h4>
                            <div className="space-y-3">
                                {client.email && (
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                        <Mail className="h-4 w-4 shrink-0" />
                                        <span>{client.email}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                        <Phone className="h-4 w-4 shrink-0" />
                                        <span dir="ltr">{formatIsraeliPhoneNumber(client.phone)}</span>
                                    </div>
                                )}
                                {(client.address || client.city) && (
                                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                        <MapPin className="h-4 w-4 shrink-0" />
                                        <span>
                                            {[client.address, client.city].filter(Boolean).join(', ')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Subscription Info */}
                        {(client.subscriptionStart || client.subscriptionPrice) && (
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2">פרטי מנוי / עסקה</h4>
                                <div className="space-y-3">
                                    {client.subscriptionPrice && (
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                            <CreditCard className="h-4 w-4 shrink-0" />
                                            <span className="font-medium">
                                                {new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(client.subscriptionPrice)}
                                                {client.subscriptionType && ` / ${client.subscriptionType === 'MONTHLY' ? 'חודשי' :
                                                    client.subscriptionType === 'YEARLY' ? 'שנתי' :
                                                        client.subscriptionType === 'WEEKLY' ? 'שבועי' : 'פרויקט'
                                                    }`}
                                            </span>
                                        </div>
                                    )}
                                    {client.subscriptionStart && (
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                            <Calendar className="h-4 w-4 shrink-0" />
                                            <span>
                                                מתאריך: {new Date(client.subscriptionStart).toLocaleDateString('he-IL')}
                                                {client.subscriptionEnd && ` עד ${new Date(client.subscriptionEnd).toLocaleDateString('he-IL')}`}
                                            </span>
                                        </div>
                                    )}
                                    {client.eventLocation && (
                                        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                                            <MapPin className="h-4 w-4 shrink-0 text-blue-500" />
                                            <span>מיקום: {client.eventLocation}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bank Details */}
                    {(client.bankName || client.bankBranch || client.bankAccount) && (
                        <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 flex items-center gap-2">
                                <Banknote className="h-4 w-4" />
                                פרטי חשבון בנק
                            </h4>
                            <div className="grid grid-cols-3 gap-4 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg text-sm">
                                {client.bankName && (
                                    <div>
                                        <span className="text-gray-500 block text-xs">בנק</span>
                                        <span className="font-medium">{getBankName(client.bankName)}</span>
                                    </div>
                                )}
                                {client.bankBranch && (
                                    <div>
                                        <span className="text-gray-500 block text-xs">סניף</span>
                                        <span className="font-medium">{client.bankBranch}</span>
                                    </div>
                                )}
                                {client.bankAccount && (
                                    <div>
                                        <span className="text-gray-500 block text-xs">מספר חשבון</span>
                                        <span className="font-medium">{client.bankAccount}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {client.notes && (
                        <div className="space-y-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                הערות
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-md border border-yellow-100 dark:border-yellow-900/20">
                                {client.notes}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
