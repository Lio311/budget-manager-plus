import { BusinessExpensesTable } from "@/components/management/expenses/BusinessExpensesTable"
import { getBusinessExpenses } from "@/lib/actions/business-expenses"

export default async function ExpensesPage() {
    const result = await getBusinessExpenses()
    const expenses = result.success ? result.data : []

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">ניהול הוצאות עסקיות</h1>
                <p className="text-muted-foreground">
                    מעקב וניהול אחר הוצאות העסק השוטפות (שיווק, שרתים, ועוד)
                </p>
            </div>

            <BusinessExpensesTable initialExpenses={expenses} />
        </div>
    )
}
