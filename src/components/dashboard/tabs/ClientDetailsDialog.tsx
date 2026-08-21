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

import { FolderGit2, Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { BusinessProjectDetailsDialog } from "../dialogs/BusinessProjectDetailsDialog"
import { BusinessProjectFormDialog } from "../dialogs/BusinessProjectFormDialog"
import { createBusinessProject } from "@/lib/actions/business-projects"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Building2, Mail, Phone, MapPin, Calendar, CreditCard, FileText, Banknote, Receipt } from "lucide-react"

interface ClientDetailsDialogProps {
    client: any
    isOpen: boolean
    onClose: () => void
    onUpdate?: () => void
}

export function ClientDetailsDialog({ client, isOpen, onClose, onUpdate }: ClientDetailsDialogProps) {
        const [selectedProject, setSelectedProject] = useState<any>(null)
    const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false)
    const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
    const [isCreatingProject, setIsCreatingProject] = useState(false)

    useEffect(() => {
        if (selectedProject && client?.projects) {
            const updated = client.projects.find((p: any) => p.id === selectedProject.id)
            if (updated) setSelectedProject(updated)
        }
    }, [client?.projects])


    
    const handleCreateProject = async (data: any) => {
        setIsCreatingProject(true)
        try {
            const result = await createBusinessProject(data)
            if (result.success) {
                toast({ title: 'הפרויקט נוסף בהצלחה' })
                setIsNewProjectOpen(false)
                if (onUpdate) onUpdate()
            } else {
                toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'שגיאה', description: 'שגיאת מערכת', variant: 'destructive' })
        }
        setIsCreatingProject(false)
    }

    if (!client) return null

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                            <Building2 className="h-6 w-6 text-pink-600 dark:text-pink-400" />
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

                    {/* Document Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20 flex flex-col items-center justify-center gap-1">
                            <FolderGit2 className="h-5 w-5 text-blue-600" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client._count?.projects || 0}</span>
                            <span className="text-xs text-gray-500">פרויקטים</span>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/20 flex flex-col items-center justify-center gap-1">
                            <FileText className="h-5 w-5 text-yellow-600" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client.quotesCount || 0}</span>
                            <span className="text-xs text-gray-500">הצעות מחיר</span>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-900/20 flex flex-col items-center justify-center gap-1">
                            <Receipt className="h-5 w-5 text-purple-600" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client.invoicesCount || 0}</span>
                            <span className="text-xs text-gray-500">חשבוניות</span>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/20 flex flex-col items-center justify-center gap-1">
                            <CreditCard className="h-5 w-5 text-orange-600" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client.creditNotesCount || 0}</span>
                            <span className="text-xs text-gray-500">זיכויים</span>
                        </div>
                    </div>

                    {/* Projects Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">הפרויקטים של הלקוח</h4>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                                onClick={() => setIsNewProjectOpen(true)}
                            >
                                <Plus className="h-3.5 w-3.5 ml-1" />
                                פרויקט חדש
                            </Button>
                        </div>
                        
                        {client.projects && client.projects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {client.projects.map((project: any) => (
                                    <div 
                                        key={project.id}
                                        onClick={() => {
                                            setSelectedProject(project)
                                            setIsProjectDetailsOpen(true)
                                        }}
                                        className="p-3 bg-white dark:bg-slate-900 border rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all flex justify-between items-center group"
                                    >
                                        <div className="overflow-hidden">
                                            <h5 className="font-medium text-sm truncate pr-1">{project.name}</h5>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <Badge variant="outline" className={`text-[10px] h-4 px-1.5 py-0 ${
                                                    project.status === 'COMPLETED' ? 'border-green-500 text-green-600' :
                                                    project.status === 'CANCELLED' ? 'border-red-500 text-red-600' :
                                                    project.status === 'ON_HOLD' ? 'border-orange-500 text-orange-600' :
                                                    'border-blue-500 text-blue-600'
                                                }`}>
                                                    {project.status === 'COMPLETED' ? 'הושלם' :
                                                     project.status === 'CANCELLED' ? 'בוטל' :
                                                     project.status === 'ON_HOLD' ? 'בהמתנה' :
                                                     'פעיל'}
                                                </Badge>
                                                <span>₪{project.budget?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed">
                                <p className="text-sm text-muted-foreground">לא נמצאו פרויקטים ללקוח זה.</p>
                            </div>
                        )}
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
                                    <a
                                        href={`https://wa.me/${client.phone.replace(/\D/g, '').replace(/^0/, '972')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors group"
                                        title="שלח הודעה ב-WhatsApp"
                                    >
                                        <Phone className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform" />
                                        <span dir="ltr" className="group-hover:underline">
                                            {formatIsraeliPhoneNumber(client.phone)}
                                        </span>
                                    </a>
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
        
        {/* Project Details Modal - Opens ON TOP of Client Modal */}
        {selectedProject && (
            <BusinessProjectDetailsDialog 
                project={selectedProject}
                isOpen={isProjectDetailsOpen}
                onClose={() => {
                    setIsProjectDetailsOpen(false)
                    setSelectedProject(null)
                }}
                onUpdate={() => {
                    if (onUpdate) onUpdate()
                }}
            />
        )}
        
        {/* New Project Modal */}
        <BusinessProjectFormDialog 
            isOpen={isNewProjectOpen}
            onClose={() => setIsNewProjectOpen(false)}
            onSubmit={handleCreateProject}
            clients={[{ id: client.id, name: client.name }]}
            initialData={{ name: '', status: 'ACTIVE', clientId: client.id, color: '#3B82F6' }}
            projects={[]}
        />
        </>
    )
}
