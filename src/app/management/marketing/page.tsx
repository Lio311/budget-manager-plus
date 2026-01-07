import { MarketingCampaigns } from '@/components/management/marketing/MarketingCampaigns'
import { MarketingExpensesTable } from '@/components/management/marketing/MarketingExpensesTable'
import { getCampaigns, getMarketingExpenses } from '@/lib/actions/marketing'
import { Card } from '@/components/ui/card'
import { TrendingUp, Megaphone, DollarSign } from 'lucide-react'

export default async function MarketingPage() {
    const campaignsRes = await getCampaigns()
    const expensesRes = await getMarketingExpenses()

    const campaigns = campaignsRes.success ? campaignsRes.data : []
    const expenses = expensesRes.success ? expensesRes.data : []

    // Calculate stats
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE').length

    // Calculate total budget (sum of campaign costs) - Optional, irrelevant if we track actual expenses
    // const totalBudget = campaigns.reduce((acc: number, curr: any) => acc + (curr.cost || 0), 0)

    // Calculate actual total expenses
    const totalExpenses = expenses.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0)

    return (
        <div className="space-y-8 pb-10" dir="rtl">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">ניהול שיווק וקמפיינים</h1>
                <p className="text-gray-500">צפה בביצועי הקמפיינים, עקוב אחר תקציבים ונהל שיתופי פעולה</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 flex items-center gap-4 border-none shadow-md bg-white">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <Megaphone size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">סך הכל קמפיינים</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalCampaigns}</h3>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4 border-none shadow-md bg-white">
                    <div className="p-3 bg-green-50 text-green-600 rounded-full">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">קמפיינים פעילים</p>
                        <h3 className="text-2xl font-bold text-gray-900">{activeCampaigns}</h3>
                    </div>
                </Card>

                <Card className="p-4 flex items-center gap-4 border-none shadow-md bg-white">
                    <div className="p-3 bg-pink-50 text-pink-600 rounded-full">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">הוצאות שיווק (נוכחי)</p>
                        <h3 className="text-2xl font-bold text-gray-900">{totalExpenses.toLocaleString()} ₪</h3>
                    </div>
                </Card>
            </div>

            {/* Tabs / Sections */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">קמפיינים פעילים</h2>
                    <MarketingCampaigns campaigns={campaigns} />
                </div>

                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 mt-8">טבלת הוצאות שיווק</h2>
                    <MarketingExpensesTable expenses={expenses} />
                </div>
            </div>
        </div>
    )
}
