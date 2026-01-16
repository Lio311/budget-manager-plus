import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDownLeft, ArrowUpRight, Calendar, FileText, Wallet } from "lucide-react"

interface ProjectDetailsDialogProps {
    project: any
    isOpen: boolean
    onClose: () => void
}

export function ProjectDetailsDialog({ project, isOpen, onClose }: ProjectDetailsDialogProps) {
    if (!project) return null

    const totalIncome = project.incomes?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0
    const totalExpenses = project.expenses?.reduce((sum: number, item: any) => sum + item.amount, 0) || 0
    const balance = totalIncome - totalExpenses

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: project.color || '#3B82F6' }}
                        />
                        <DialogTitle className="text-xl md:text-2xl">{project.name}</DialogTitle>
                    </div>
                </DialogHeader>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                            <ArrowDownLeft className="h-5 w-5" />
                            <span className="font-medium">הכנסות</span>
                        </div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                            {formatCurrency(totalIncome)}
                        </div>
                        <div className="text-sm text-green-600/80 mt-1">
                            {project.incomes?.length || 0} עסקאות
                        </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                            <ArrowUpRight className="h-5 w-5" />
                            <span className="font-medium">הוצאות</span>
                        </div>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                            {formatCurrency(totalExpenses)}
                        </div>
                        <div className="text-sm text-red-600/80 mt-1">
                            {project.expenses?.length || 0} הוצאות
                        </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${balance >= 0
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900'
                        : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900'
                        }`}>
                        <div className={`flex items-center gap-2 mb-2 ${balance >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                            <Wallet className="h-5 w-5" />
                            <span className="font-medium">רווח נקי</span>
                        </div>
                        <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
                            {formatCurrency(balance)}
                        </div>
                        <div className="text-sm opacity-80 mt-1">
                            רווחיות: {totalIncome ? Math.round((balance / totalIncome) * 100) : 0}%
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="incomes" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                        <TabsTrigger
                            value="incomes"
                            className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-900/20 px-6 py-2"
                        >
                            הכנסות ({project.incomes?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger
                            value="expenses"
                            className="rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-900/20 px-6 py-2"
                        >
                            הוצאות ({project.expenses?.length || 0})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="incomes" className="mt-4">
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500">
                                    <tr>
                                        <th className="p-3">תאריך</th>
                                        <th className="p-3">תיאור source</th>
                                        <th className="p-3">סכום</th>
                                        <th className="p-3 hidden sm:table-cell">אמצעי תשלום</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-700">
                                    {project.incomes?.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-500">
                                                אין הכנסות בפרויקט זה
                                            </td>
                                        </tr>
                                    )}
                                    {project.incomes?.map((income: any) => (
                                        <tr key={income.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="p-3 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {income.date ? new Date(income.date).toLocaleDateString('he-IL') : '-'}
                                            </td>
                                            <td className="p-3 font-medium">{income.source}</td>
                                            <td className="p-3 text-green-600 font-bold">{formatCurrency(income.amount)}</td>
                                            <td className="p-3 hidden sm:table-cell text-gray-500">{income.paymentMethod || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    <TabsContent value="expenses" className="mt-4">
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500">
                                    <tr>
                                        <th className="p-3">תאריך</th>
                                        <th className="p-3">תיאור</th>
                                        <th className="p-3">קטגוריה</th>
                                        <th className="p-3">סכום</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-700">
                                    {project.expenses?.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-500">
                                                אין הוצאות בפרויקט זה
                                            </td>
                                        </tr>
                                    )}
                                    {project.expenses?.map((expense: any) => (
                                        <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <td className="p-3 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {expense.date ? new Date(expense.date).toLocaleDateString('he-IL') : '-'}
                                            </td>
                                            <td className="p-3 font-medium">
                                                {expense.description || expense.category}
                                            </td>
                                            <td className="p-3 text-gray-500">{expense.category}</td>
                                            <td className="p-3 text-red-600 font-bold">{formatCurrency(expense.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
