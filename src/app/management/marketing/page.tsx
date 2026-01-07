import { MarketingCampaigns } from '@/components/management/marketing/MarketingCampaigns'
import { getCampaigns } from '@/lib/actions/marketing'
import { Card } from '@/components/ui/card'
import { Megaphone, TrendingUp, Users } from 'lucide-react'

export default async function MarketingPage() {
    const { success, data } = await getCampaigns()
    const campaigns = success ? data : []

    // Calculate Stats
    const totalBudget = campaigns?.reduce((acc: number, c: any) => acc + (c.cost || 0), 0) || 0
    const activeCount = campaigns?.filter((c: any) => c.status === 'ACTIVE').length || 0

    return (
        <div className="space-y-8 animate-fade-in" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">ניהול שיווק</h2>
                    <p className="text-gray-500">קמפיינים, שיתופי פעולה ויוזמות</p>
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg overflow-hidden relative">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Megaphone size={24} className="text-white" />
                    </div>
                    <div>
                        <p className="text-pink-100 text-sm font-medium">סה"כ קמפיינים</p>
                        <h3 className="text-2xl font-bold">{campaigns?.length || 0}</h3>
                    </div>
                    <Megaphone size={120} className="absolute -bottom-8 -left-8 text-white/10 rotate-12" />
                </Card>

                <Card className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">תקציב שיווק כולל</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalBudget.toLocaleString()} ₪</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">קמפיינים פעילים</p>
                        <h3 className="text-2xl font-bold text-gray-900">{activeCount}</h3>
                    </div>
                </Card>
            </div>

            <MarketingCampaigns campaigns={campaigns || []} />
        </div>
    )
}
