import { MarketingCampaigns } from "@/components/management/marketing/MarketingCampaigns"
import { getCampaigns } from "@/lib/actions/business-expenses"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Target } from "lucide-react"

export default async function MarketingPage() {
    const { data: campaigns } = await getCampaigns()

    const activeCampaigns = campaigns?.filter((c: any) => c.status === 'active') || []
    const totalBudget = campaigns?.reduce((sum: number, c: any) => sum + (c.budget || 0), 0) || 0

    // Calculate total spent from connected expenses across all campaigns
    const totalSpent = campaigns?.reduce((sum: number, c: any) => {
        const campaignExpenses = c.expenses?.reduce((expSum: number, e: any) => expSum + e.amount, 0) || 0
        return sum + campaignExpenses
    }, 0) || 0

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">ניהול שיווק</h1>
                <p className="text-gray-500 mt-2">מעקב אחר קמפיינים ותקציבי שיווק</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">תקציב כולל</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪{totalBudget.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">נוצל בפועל</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₪{totalSpent.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% מהתקציב
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">קמפיינים פעילים</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCampaigns.length}</div>
                    </CardContent>
                </Card>
            </div>
            {/* Campaigns Table */}
            <MarketingCampaigns campaigns={campaigns || []} />
        </div>
    )
}
