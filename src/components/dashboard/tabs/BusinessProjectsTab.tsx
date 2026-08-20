'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { useDemo } from '@/contexts/DemoContext'
import { useConfirm } from '@/hooks/useConfirm'
import { useToast } from '@/hooks/use-toast'
import { getClients } from '@/lib/actions/clients'
import {
    getBusinessProjects,
    createBusinessProject,
    updateBusinessProject,
    deleteBusinessProject,
    getBusinessProjectDetails,
    getBusinessProjectsList,
    type BusinessProjectFormData,
    type ProjectWithStats,
} from '@/lib/actions/business-projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Plus,
    Search,
    FolderOpen,
    ArrowUpCircle,
    ArrowDownCircle,
    Wallet,
    Pencil,
    Trash2,
    Users,
    ChevronDown,
    ChevronUp,
    Calendar,
    Target,
    TrendingUp,
    Layers,
    Info,
    LayoutGrid,
    List,
    Loader2,
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { BusinessProjectFormDialog } from '@/components/dashboard/dialogs/BusinessProjectFormDialog'
import { BusinessProjectDetailsDialog } from '@/components/dashboard/dialogs/BusinessProjectDetailsDialog'

// ─── Constants ───────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; dotColor: string }> = {
    ACTIVE: { label: 'פעיל', className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20', dotColor: 'bg-green-500' },
    COMPLETED: { label: 'הושלם', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', dotColor: 'bg-blue-500' },
    ON_HOLD: { label: 'בהמתנה', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', dotColor: 'bg-amber-500' },
    CANCELLED: { label: 'בוטל', className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20', dotColor: 'bg-red-500' },
}

// ─── Skeleton ────────────────────────────────────────────────

const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-700", className)} />
)

// ─── KPI Card Component ──────────────────────────────────────

function KPICard({
    icon: Icon,
    label,
    value,
    color,
    delay,
}: {
    icon: any
    label: string
    value: string
    color: string
    delay: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden relative">
                <div className={cn("absolute top-0 left-0 right-0 h-1", color)} />
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", `${color}/10`)}>
                            <Icon className={cn("h-5 w-5", color.replace('bg-', 'text-'))} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">{label}</p>
                            <p className="text-lg font-bold dir-ltr">{value}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}

// ─── Project Card Component ──────────────────────────────────

function ProjectCard({
    project,
    onClick,
    onEdit,
    onDelete,
    onAddSubProject,
    onChildClick,
    onChildEdit,
    onChildDelete,
    delay,
}: {
    project: ProjectWithStats
    onClick: () => void
    onEdit: (e: React.MouseEvent) => void
    onDelete: (e: React.MouseEvent) => void
    onAddSubProject: (e: React.MouseEvent) => void
    onChildClick: (child: ProjectWithStats) => void
    onChildEdit: (child: ProjectWithStats, e: React.MouseEvent) => void
    onChildDelete: (child: ProjectWithStats, e: React.MouseEvent) => void
    delay: number
}) {
    const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG['ACTIVE']
    const hasChildren = project.children && project.children.length > 0
    const budgetProgress = project.budget
        ? Math.min(100, (project.stats.totalExpenses / project.budget) * 100)
        : null

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
        >
            <Card
                className="hover:shadow-lg transition-all duration-300 group cursor-pointer border border-slate-200 dark:border-slate-700/50 relative overflow-hidden"
                onClick={onClick}
            >
                {/* Color accent */}
                <div
                    className="absolute top-0 right-0 w-1.5 h-full"
                    style={{ backgroundColor: project.color || '#3B82F6' }}
                />

                <CardContent className="p-4 pr-5">
                    {/* Header with always-visible actions */}
                    <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base truncate">{project.name}</h3>
                            {project.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{project.description}</p>
                            )}
                        </div>
                        <div className="flex gap-1 shrink-0 mr-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={onAddSubProject}
                                title="הוסף תת-פרויקט"
                            >
                                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-slate-100 dark:hover:bg-slate-700"
                                onClick={onEdit}
                            >
                                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500"
                                onClick={onDelete}
                            >
                                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-3">
                        <Badge className={cn("text-[10px] border", statusInfo.className)}>
                            {statusInfo.label}
                        </Badge>
                    </div>

                    {/* Client & Date Meta */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-muted-foreground">
                        {project.clientName && (
                            <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {project.clientName}
                            </span>
                        )}
                        {project.startDate && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(project.startDate), 'MM/yyyy')}
                                {project.endDate && ` - ${format(new Date(project.endDate), 'MM/yyyy')}`}
                            </span>
                        )}
                        {hasChildren && (
                            <span className="flex items-center gap-1">
                                <Layers className="h-3 w-3" />
                                {project.children.length} תתי-פרויקטים
                            </span>
                        )}
                    </div>

                    {/* Budget Progress */}
                    {budgetProgress !== null && (
                        <div className="mb-3">
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1">
                                <span>ניצול תקציב</span>
                                <span className={cn(
                                    "font-medium",
                                    budgetProgress > 90 ? "text-red-500" : budgetProgress > 70 ? "text-amber-500" : "text-green-500"
                                )}>
                                    {budgetProgress.toFixed(0)}%
                                </span>
                            </div>
                            <Progress value={budgetProgress} className="h-1.5" />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                                <ArrowUpCircle className="h-3 w-3 text-green-500" />
                                הכנסות
                            </div>
                            <p className="text-xs font-semibold dir-ltr">{formatCurrency(project.stats.totalIncome)}</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                                <ArrowDownCircle className="h-3 w-3 text-red-500" />
                                הוצאות
                            </div>
                            <p className="text-xs font-semibold dir-ltr">{formatCurrency(project.stats.totalExpenses)}</p>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">מאזן</span>
                        </div>
                        <span className={cn(
                            "text-sm font-bold dir-ltr",
                            project.stats.balance > 0 ? "text-green-600" : project.stats.balance < 0 ? "text-red-600" : ""
                        )}>
                            {formatCurrency(project.stats.balance)}
                        </span>
                    </div>

                    {/* Sub-projects tree */}
                    {hasChildren && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                <span className="font-medium">תתי-פרויקטים ({project.children.length})</span>
                            </div>

                            <div className="relative overflow-hidden">
                                <div className="absolute right-3.5 top-0 bottom-4 w-px bg-slate-200 dark:bg-slate-700/50" />
                                <div className="space-y-1.5 pl-2 pr-6">
                                    {project.children.map((child, index) => {
                                        const childStatus = STATUS_CONFIG[child.status] || STATUS_CONFIG['ACTIVE']
                                        return (
                                            <div
                                                key={child.id}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onChildClick(child)
                                                }}
                                                className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-700/30 text-xs relative group hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                                            >
                                                {/* Horizontal tree line */}
                                                <div className="absolute -right-[11px] top-1/2 w-2.5 h-px bg-slate-200 dark:bg-slate-700/50" />
                                                
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: child.color || project.color || '#3B82F6' }}
                                                    />
                                                    <span className="font-medium truncate">{child.name}</span>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", childStatus.dotColor)} />
                                                </div>
                                                
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={cn(
                                                        "font-semibold dir-ltr",
                                                        child.stats.balance >= 0 ? "text-green-600" : "text-red-600"
                                                    )}>
                                                        {formatCurrency(child.stats.balance)}
                                                    </span>
                                                    
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 hover:bg-slate-200 dark:hover:bg-slate-700"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onChildEdit(child, e)
                                                            }}
                                                        >
                                                            <Pencil className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onChildDelete(child, e)
                                                            }}
                                                        >
                                                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}

// ─── Main Component ──────────────────────────────────────────

export function BusinessProjectsTab() {
    const { isDemo, data: demoData, interceptAction } = useDemo()
    const { toast } = useToast()
    const confirm = useConfirm()

    // Data fetching
    const { data: projectsRes, isLoading, mutate } = useSWR(
        isDemo ? null : ['business-projects'],
        () => getBusinessProjects()
    )
    const { data: clientsRes } = useSWR(
        isDemo ? null : ['clients-list', 'BUSINESS'],
        () => getClients('BUSINESS')
    )

    const projects: ProjectWithStats[] = isDemo ? [] : (projectsRes?.data || [])
    const clients = (clientsRes as any)?.data || []

    // UI State
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [clientFilter, setClientFilter] = useState('ALL')
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<any>(null)
    const [detailsProject, setDetailsProject] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)

    // ─── Computed ─────────────────────────────────────────────

    const filteredProjects = useMemo(() => {
        return projects.filter(p => {
            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                const nameMatch = p.name.toLowerCase().includes(term)
                const clientMatch = p.clientName?.toLowerCase().includes(term)
                const descMatch = p.description?.toLowerCase().includes(term)
                const childMatch = p.children?.some(c => c.name.toLowerCase().includes(term))
                if (!nameMatch && !clientMatch && !descMatch && !childMatch) return false
            }
            if (statusFilter !== 'ALL' && p.status !== statusFilter) return false
            if (clientFilter !== 'ALL' && p.clientId !== clientFilter) return false
            return true
        })
    }, [projects, searchTerm, statusFilter, clientFilter])

    const kpiStats = useMemo(() => {
        const active = projects.filter(p => p.status === 'ACTIVE').length
        const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
        const totalIncome = projects.reduce((sum, p) => sum + p.stats.totalIncome, 0)
        const totalProfit = projects.reduce((sum, p) => sum + p.stats.balance, 0)
        return { active, totalBudget, totalIncome, totalProfit }
    }, [projects])

    // Unique clients that have projects
    const projectClients = useMemo(() => {
        const clientMap = new Map<string, string>()
        projects.forEach(p => {
            if (p.clientId && p.clientName) {
                clientMap.set(p.clientId, p.clientName)
            }
        })
        return Array.from(clientMap.entries()).map(([id, name]) => ({ id, name }))
    }, [projects])

    // ─── Handlers ────────────────────────────────────────────

    const handleCreate = async (data: BusinessProjectFormData) => {
        if (isDemo) { interceptAction(); return }
        const result = await createBusinessProject(data)
        if (result.success) {
            toast({ title: 'פרויקט נוצר בהצלחה' })
            mutate()
        } else {
            toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
        }
    }

    const handleUpdate = async (data: BusinessProjectFormData) => {
        if (isDemo) { interceptAction(); return }
        if (!editingProject) return
        const result = await updateBusinessProject(editingProject.id, data)
        if (result.success) {
            toast({ title: 'פרויקט עודכן בהצלחה' })
            mutate()
            setEditingProject(null)
        } else {
            toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
        }
    }

    const handleDelete = async (project: ProjectWithStats) => {
        if (isDemo) { interceptAction(); return }
        const confirmed = await confirm(
            `האם אתה בטוח שברצונך למחוק את הפרויקט "${project.name}"?${project.children?.length ? ` הפרויקט מכיל ${project.children.length} תתי-פרויקטים.` : ''}`,
            'מחיקת פרויקט'
        )
        if (confirmed) {
            const result = await deleteBusinessProject(project.id)
            if (result.success) {
                toast({ title: 'פרויקט נמחק בהצלחה' })
                mutate()
            } else {
                toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
            }
        }
    }

    const handleProjectClick = async (project: ProjectWithStats) => {
        setIsLoadingDetails(true)
        try {
            const result = await getBusinessProjectDetails(project.id)
            if (result.success) {
                setDetailsProject(result.data)
                setIsDetailsOpen(true)
            } else {
                toast({ title: 'שגיאה', description: 'לא ניתן לטעון פרטי פרויקט', variant: 'destructive' })
            }
        } catch {
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בטעינת הפרטים', variant: 'destructive' })
        } finally {
            setIsLoadingDetails(false)
        }
    }

    const openEdit = (project: ProjectWithStats, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingProject(project)
        setIsFormOpen(true)
    }

    const openAddSubProject = (project: ProjectWithStats, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingProject({ name: '', parentId: project.id })
        setIsFormOpen(true)
    }

    const openDelete = (project: ProjectWithStats, e: React.MouseEvent) => {
        e.stopPropagation()
        handleDelete(project)
    }

    // ─── Render ──────────────────────────────────────────────

    return (
        <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">פרויקטים</h2>
                    <p className="text-muted-foreground">ניהול ומעקב אחרי פרויקטים עסקיים</p>
                </div>
                <Button
                    onClick={() => {
                        setEditingProject(null)
                        setIsFormOpen(true)
                    }}
                    className="gap-2 shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    פרויקט חדש
                </Button>
            </div>

            {/* KPI Summary Cards */}
            {!isLoading && projects.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KPICard
                        icon={FolderOpen}
                        label="פרויקטים פעילים"
                        value={kpiStats.active.toString()}
                        color="bg-violet-500"
                        delay={0}
                    />
                    <KPICard
                        icon={Target}
                        label="תקציב מתוכנן"
                        value={formatCurrency(kpiStats.totalBudget)}
                        color="bg-blue-500"
                        delay={0.1}
                    />
                    <KPICard
                        icon={TrendingUp}
                        label="הכנסות כולל"
                        value={formatCurrency(kpiStats.totalIncome)}
                        color="bg-green-500"
                        delay={0.2}
                    />
                    <KPICard
                        icon={Wallet}
                        label="רווח/הפסד כולל"
                        value={formatCurrency(kpiStats.totalProfit)}
                        color={kpiStats.totalProfit >= 0 ? "bg-emerald-500" : "bg-red-500"}
                        delay={0.3}
                    />
                </div>
            )}

            {/* Filters */}
            {!isLoading && projects.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="חפש פרויקט..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-9 text-right"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[160px] text-right">
                            <SelectValue placeholder="סטטוס" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">כל הסטטוסים</SelectItem>
                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-2 h-2 rounded-full", val.dotColor)} />
                                        {val.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {projectClients.length > 0 && (
                        <Select value={clientFilter} onValueChange={setClientFilter}>
                            <SelectTrigger className="w-full sm:w-[160px] text-right">
                                <SelectValue placeholder="לקוח" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">כל הלקוחות</SelectItem>
                                {projectClients.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="h-[240px]">
                            <CardContent className="p-4">
                                <Skeleton className="h-5 w-[60%] mb-3" />
                                <Skeleton className="h-3 w-[40%] mb-4" />
                                <Skeleton className="h-2 w-full mb-4" />
                                <Skeleton className="h-14 w-full mb-3" />
                                <div className="grid grid-cols-2 gap-3">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && projects.length === 0 && (
                <Card className="border-dashed border-2">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="w-20 h-20 rounded-2xl bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center mb-4 mx-auto">
                                <FolderOpen className="h-10 w-10 text-violet-500 dark:text-violet-400" />
                            </div>
                            <h3 className="font-bold text-xl mb-2">אין פרויקטים עדיין</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                צור פרויקט עסקי חדש כדי לעקוב אחרי הכנסות, הוצאות ותקציב.
                                ניתן לקשר פרויקטים ללקוחות וליצור תתי-פרויקטים.
                            </p>
                            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                צור פרויקט ראשון
                            </Button>
                        </motion.div>
                    </CardContent>
                </Card>
            )}

            {/* No Results After Filter */}
            {!isLoading && projects.length > 0 && filteredProjects.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <h3 className="font-semibold text-lg mb-1">לא נמצאו פרויקטים</h3>
                    <p>נסה לשנות את מונחי החיפוש או הסינון</p>
                </div>
            )}

            {/* Project Cards Grid */}
            {!isLoading && filteredProjects.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project, idx) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => handleProjectClick(project)}
                            onEdit={(e) => openEdit(project, e)}
                            onDelete={(e) => openDelete(project, e)}
                            onAddSubProject={(e) => openAddSubProject(project, e)}
                            onChildClick={(child) => handleProjectClick(child as ProjectWithStats)}
                            onChildEdit={(child, e) => openEdit(child as ProjectWithStats, e)}
                            onChildDelete={(child, e) => openDelete(child as ProjectWithStats, e)}
                            delay={idx * 0.07}
                        />
                    ))}
                </div>
            )}

            {/* Loading Details Overlay */}
            {isLoadingDetails && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                        <span className="font-medium">טוען פרטי פרויקט...</span>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <BusinessProjectFormDialog
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false)
                    setEditingProject(null)
                }}
                onSubmit={editingProject?.id ? handleUpdate : handleCreate}
                initialData={editingProject || undefined}
                clients={clients.map((c: any) => ({ id: c.id, name: c.name }))}
                projects={projects.map((p: any) => ({ id: p.id, name: p.name, parentId: null }))}
                isEdit={!!editingProject?.id}
            />

            <BusinessProjectDetailsDialog
                project={detailsProject}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />
        </div>
    )
}
