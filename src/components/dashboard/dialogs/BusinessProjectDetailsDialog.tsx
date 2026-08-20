'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    Calendar,
    Users,
    FolderOpen,
    TrendingUp,
    TrendingDown,
    Clock,
    ChevronLeft,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ProjectStagesTab } from '../projects/ProjectStagesTab'


interface BusinessProjectDetailsDialogProps {
    project: any
    isOpen: boolean
    onClose: () => void
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    ACTIVE: { label: 'פעיל', variant: 'default', className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
    COMPLETED: { label: 'הושלם', variant: 'secondary', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
    ON_HOLD: { label: 'בהמתנה', variant: 'outline', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
    CANCELLED: { label: 'בוטל', variant: 'destructive', className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' },
}

export function BusinessProjectDetailsDialog({
    project,
    isOpen,
    onClose,
}: BusinessProjectDetailsDialogProps) {
    const [activeTab, setActiveTab] = useState('overview')

    if (!project) return null

    const incomes = project.incomes || []
    const expenses = project.expenses || []
    const children = project.children || []

    const totalIncome = incomes.reduce((sum: number, i: any) => sum + i.amount, 0)
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
    const balance = totalIncome - totalExpenses

    // Include children's stats for total
    const childTotalIncome = children.reduce((sum: number, c: any) => {
        return sum + (c.incomes || []).reduce((s: number, i: any) => s + i.amount, 0)
    }, 0)
    const childTotalExpenses = children.reduce((sum: number, c: any) => {
        return sum + (c.expenses || []).reduce((s: number, e: any) => s + e.amount, 0)
    }, 0)
    const grandTotalIncome = totalIncome + childTotalIncome
    const grandTotalExpenses = totalExpenses + childTotalExpenses
    const grandBalance = grandTotalIncome - grandTotalExpenses

    const budgetProgress = project.budget
        ? Math.min(100, (grandTotalExpenses / project.budget) * 100)
        : null

    const budgetHealthColor = budgetProgress !== null
        ? budgetProgress > 90 ? 'text-red-500' : budgetProgress > 70 ? 'text-amber-500' : 'text-green-500'
        : ''

    const statusInfo = STATUS_MAP[project.status] || STATUS_MAP['ACTIVE']

    // Combined transaction timeline
    const allTransactions = [
        ...incomes.map((i: any) => ({ ...i, type: 'income' as const })),
        ...expenses.map((e: any) => ({ ...e, type: 'expense' as const })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden p-0" dir="rtl">
                {/* Header with color accent */}
                <div
                    className="relative px-6 pt-6 pb-4"
                    style={{
                        borderBottom: `3px solid ${project.color || '#3B82F6'}`,
                    }}
                >
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div
                                    className="w-3 h-10 rounded-full shrink-0"
                                    style={{ backgroundColor: project.color || '#3B82F6' }}
                                />
                                <div>
                                    <DialogTitle className="text-2xl font-bold mr-6 sm:mr-0">
                                        {project.name}
                                    </DialogTitle>
                                    {project.description && (
                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <Badge className={cn("shrink-0 text-xs font-medium border", statusInfo.className)}>
                                {statusInfo.label}
                            </Badge>
                            {project.client && (
                                <div className="flex items-center gap-1.5">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>{project.client.name}</span>
                                </div>
                            )}
                            {project.parent && (
                                <div className="flex items-center gap-1.5">
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                    <span>תת-פרויקט של {project.parent.name}</span>
                                </div>
                            )}
                            {(project.startDate || project.endDate) && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                        {project.startDate && format(new Date(project.startDate), 'dd/MM/yyyy')}
                                        {project.startDate && project.endDate && ' - '}
                                        {project.endDate && format(new Date(project.endDate), 'dd/MM/yyyy')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </DialogHeader>
                </div>

                {/* Financial Summary Cards */}
                <div className="px-6 pt-4">
                    <div className="grid grid-cols-3 gap-3">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card className="border-0 bg-green-50 dark:bg-green-950/30">
                                <CardContent className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-green-600 dark:text-green-400 mb-1">
                                        <ArrowUpCircle className="h-4 w-4" />
                                        <span className="text-xs font-medium">הכנסות</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-700 dark:text-green-300 dir-ltr">
                                        {formatCurrency(grandTotalIncome)}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="border-0 bg-red-50 dark:bg-red-950/30">
                                <CardContent className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5 text-red-600 dark:text-red-400 mb-1">
                                        <ArrowDownCircle className="h-4 w-4" />
                                        <span className="text-xs font-medium">הוצאות</span>
                                    </div>
                                    <p className="text-lg font-bold text-red-700 dark:text-red-300 dir-ltr">
                                        {formatCurrency(grandTotalExpenses)}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className={cn(
                                "border-0",
                                grandBalance >= 0
                                    ? "bg-emerald-50 dark:bg-emerald-950/30"
                                    : "bg-orange-50 dark:bg-orange-950/30"
                            )}>
                                <CardContent className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5 mb-1">
                                        <Wallet className={cn(
                                            "h-4 w-4",
                                            grandBalance >= 0
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-orange-600 dark:text-orange-400"
                                        )} />
                                        <span className={cn(
                                            "text-xs font-medium",
                                            grandBalance >= 0
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-orange-600 dark:text-orange-400"
                                        )}>רווח</span>
                                    </div>
                                    <p className={cn(
                                        "text-lg font-bold dir-ltr",
                                        grandBalance >= 0
                                            ? "text-emerald-700 dark:text-emerald-300"
                                            : "text-orange-700 dark:text-orange-300"
                                    )}>
                                        {formatCurrency(grandBalance)}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Budget Progress Bar */}
                    {project.budget && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                        >
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-muted-foreground">ניצול תקציב</span>
                                <span className={cn("font-semibold", budgetHealthColor)}>
                                    {budgetProgress?.toFixed(0)}%
                                </span>
                            </div>
                            <Progress
                                value={budgetProgress || 0}
                                className="h-2"
                            />
                            <div className="flex justify-between items-center text-xs text-muted-foreground mt-1.5">
                                <span>הוצאות: {formatCurrency(grandTotalExpenses)}</span>
                                <span>תקציב: {formatCurrency(project.budget)}</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Tabs Content */}
                <div className="px-6 pb-6 pt-4 overflow-y-auto max-h-[40vh]">
                    <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
                        <TabsList className="w-full grid grid-cols-4 h-9 bg-slate-100 dark:bg-slate-800/50">
                            <TabsTrigger value="overview" className="text-xs">סקירה</TabsTrigger>
                            <TabsTrigger value="transactions" className="text-xs">תנועות ({allTransactions.length})</TabsTrigger>
                            <TabsTrigger value="stages" className="text-xs">שלבים ({project?.stages?.length || 0})</TabsTrigger>
                            {children.length > 0 && (
                                <TabsTrigger value="children" className="text-xs">
                                    תתי-פרויקטים ({children.length})
                                </TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="overview" className="mt-3 space-y-3">
                            {/* Recent Transactions Preview */}
                            <h4 className="text-sm font-semibold text-muted-foreground">תנועות אחרונות</h4>
                            {allTransactions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    אין תנועות בפרויקט זה
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {allTransactions.slice(0, 5).map((t: any, idx: number) => (
                                        <motion.div
                                            key={t.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                {t.type === 'income' ? (
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {t.type === 'income' ? (t.source || 'הכנסה') : (t.description || t.category || 'הוצאה')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(t.date), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-sm font-semibold dir-ltr",
                                                t.type === 'income' ? "text-green-600" : "text-red-600"
                                            )}>
                                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </span>
                                        </motion.div>
                                    ))}
                                    {allTransactions.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            className="w-full text-sm text-muted-foreground"
                                            onClick={() => setActiveTab('transactions')}
                                        >
                                            הצג את כל {allTransactions.length} התנועות
                                        </Button>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="stages" className="mt-3">
                            <ProjectStagesTab project={project} onUpdate={() => window.location.reload()} />
                        </TabsContent>

                        <TabsContent value="transactions" className="mt-3">
                            {allTransactions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                    <p>אין תנועות בפרויקט זה</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {allTransactions.map((t: any, idx: number) => (
                                        <motion.div
                                            key={t.id}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                                        >
                                            <div className="flex items-center gap-2">
                                                {t.type === 'income' ? (
                                                    <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                        <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                                    </div>
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                                        <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {t.type === 'income' ? (t.source || 'הכנסה') : (t.description || t.category || 'הוצאה')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t.category && <span>{t.category} • </span>}
                                                        {format(new Date(t.date), 'dd/MM/yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                "text-sm font-semibold dir-ltr",
                                                t.type === 'income' ? "text-green-600" : "text-red-600"
                                            )}>
                                                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {children.length > 0 && (
                            <TabsContent value="children" className="mt-3">
                                <div className="space-y-3">
                                    {children.map((child: any) => {
                                        const cIncome = (child.incomes || []).reduce((s: number, i: any) => s + i.amount, 0)
                                        const cExpense = (child.expenses || []).reduce((s: number, e: any) => s + e.amount, 0)
                                        const cBalance = cIncome - cExpense
                                        return (
                                            <Card key={child.id} className="border border-slate-200 dark:border-slate-700">
                                                <CardContent className="p-4">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div
                                                            className="w-2.5 h-8 rounded-full"
                                                            style={{ backgroundColor: child.color || project.color || '#3B82F6' }}
                                                        />
                                                        <div className="flex-1">
                                                            <h5 className="font-semibold text-sm">{child.name}</h5>
                                                            {child.client && (
                                                                <p className="text-xs text-muted-foreground">{child.client.name}</p>
                                                            )}
                                                        </div>
                                                        <Badge className={cn(
                                                            "text-[10px] border",
                                                            STATUS_MAP[child.status]?.className || STATUS_MAP['ACTIVE'].className
                                                        )}>
                                                            {STATUS_MAP[child.status]?.label || 'פעיל'}
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3 text-center">
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground">הכנסות</p>
                                                            <p className="text-sm font-semibold text-green-600 dir-ltr">{formatCurrency(cIncome)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground">הוצאות</p>
                                                            <p className="text-sm font-semibold text-red-600 dir-ltr">{formatCurrency(cExpense)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground">מאזן</p>
                                                            <p className={cn("text-sm font-semibold dir-ltr", cBalance >= 0 ? "text-green-600" : "text-red-600")}>
                                                                {formatCurrency(cBalance)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}
