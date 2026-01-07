'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Edit2, Calendar, DollarSign, Tag, Globe, User, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { deleteCampaign } from '@/lib/actions/business-expenses'
import { toast } from 'sonner'
import { NewCampaignDialog } from './NewCampaignDialog'
import { motion } from 'framer-motion'

export function MarketingCampaigns({ campaigns }: { campaigns: any[] }) {

    const handleDelete = async (id: string) => {
        if (confirm('האם אתה בטוח שברצונך למחוק קמפיין זה? ההוצאה המקושרת לא תימחק אוטומטית.')) {
            const res = await deleteCampaign(id)
            if (res.success) {
                toast.success('קמפיין נמחק בהצלחה')
            } else {
                toast.error('שגיאה במחיקת הקמפיין')
            }
        }
    }

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'HIGH': return 'bg-red-100 text-red-700 border-red-200'
            case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 'LOW': return 'bg-green-100 text-green-700 border-green-200'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SOCIAL': return <Globe size={16} />
            case 'COLLABORATION': return <User size={16} />
            case 'PPC': return <DollarSign size={16} />
            default: return <Tag size={16} />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    {/* Header handled in page usually, but we can put controls here */}
                </div>
                <NewCampaignDialog />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {campaigns.map((campaign, index) => (
                    <motion.div
                        key={campaign.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="p-5 h-full flex flex-col hover:shadow-lg transition-shadow border-t-4 border-t-pink-500 relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                                        {getTypeIcon(campaign.type)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 line-clamp-1" title={campaign.name}>{campaign.name}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                            <Badge variant="outline" className="text-xs py-0 h-5 font-normal">
                                                {campaign.type}
                                            </Badge>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(campaign.priority)}`}>
                                                {campaign.priority}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleDelete(campaign.id)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="space-y-3 flex-1">
                                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
                                    <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> התחלה:</span>
                                    <span className="font-medium">{campaign.startDate ? format(new Date(campaign.startDate), 'dd/MM/yyyy', { locale: he }) : '-'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
                                    <span className="text-gray-500 flex items-center gap-1"><Calendar size={14} /> סיום:</span>
                                    <span className="font-medium">{campaign.endDate ? format(new Date(campaign.endDate), 'dd/MM/yyyy', { locale: he }) : 'לא מוגדר'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-md">
                                    <span className="text-gray-500 flex items-center gap-1"><DollarSign size={14} /> עלות:</span>
                                    <span className="font-bold text-gray-900">{campaign.cost ? `${campaign.cost.toLocaleString()} ₪` : '0 ₪'}</span>
                                </div>

                                {campaign.notes && (
                                    <div className="text-xs text-gray-500 bg-yellow-50/50 p-2 rounded border border-yellow-100 mt-2 line-clamp-3">
                                        {campaign.notes}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                <span>{campaign.status}</span>
                                {campaign.expenses?.length > 0 && (
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100">
                                        קושר להוצאה
                                    </Badge>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                ))}

                {campaigns.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <Globe size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium">אין קמפיינים פעילים</h3>
                        <p className="text-sm mt-1">צור קמפיין חדש כדי להתחיל לעקוב אחר פעילות שיווקית</p>
                    </div>
                )}
            </div>
        </div>
    )
}
