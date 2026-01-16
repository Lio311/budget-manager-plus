'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, FolderOpen, ArrowUpCircle, ArrowDownCircle, Wallet, Pencil, Trash2, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getProjectsWithStats, addProject, updateProject, deleteProject, getProjectDetails } from '@/lib/actions/projects'
import { ProjectDetailsDialog } from '@/components/dashboard/dialogs/ProjectDetailsDialog'
import { ProjectsTutorial } from '@/components/dashboard/tutorial/ProjectsTutorial'
import { PRESET_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { useConfirm } from '@/hooks/useConfirm'

// Local Skeleton component since standard one is missing or different
const Skeleton = ({ className }: { className?: string }) => (
    <div className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-700", className)} />
)

interface Project {
    id: string
    name: string
    color: string | null
    stats: {
        totalIncome: number
        totalExpenses: number
        balance: number
    }
}

export function ProjectsTab() {
    const { data: response, error, isLoading, mutate } = useSWR(['projects-stats'], () => getProjectsWithStats('PERSONAL'))
    const projects = response?.data || []
    const { toast } = useToast()
    const confirm = useConfirm()

    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)

    // Details Dialog State
    const [viewProject, setViewProject] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isLoadingDetails, setIsLoadingDetails] = useState(false)

    // Form states
    const [name, setName] = useState('')
    const [color, setColor] = useState(PRESET_COLORS[0].hex)
    const [submitting, setSubmitting] = useState(false)
    const [showTutorial, setShowTutorial] = useState(false)

    const handleAdd = async () => {
        if (!name.trim()) return

        setSubmitting(true)
        try {
            const result = await addProject({ name, color }, 'PERSONAL')
            if (result.success) {
                toast({ title: 'פרויקט נוצר בהצלחה' })
                mutate()
                setIsAddOpen(false)
                resetForm()
            } else {
                toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'שגיאה', description: 'אירעה שגיאה ביצירת הפרויקט', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = async () => {
        if (!editingProject || !name.trim()) return

        setSubmitting(true)
        try {
            const result = await updateProject(editingProject.id, { name, color })
            if (result.success) {
                toast({ title: 'פרויקט עודכן בהצלחה' })
                mutate()
                setIsEditOpen(false)
                resetForm()
            } else {
                toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בעדכון הפרויקט', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (project: Project) => {
        const confirmed = await confirm(
            `האם אתה בטוח שברצונך למחוק את הפרויקט "${project.name}"? הפעולה אינה הפיכה.`,
            'מחק פרויקט'
        )

        if (confirmed) {
            try {
                const result = await deleteProject(project.id)
                if (result.success) {
                    toast({ title: 'פרויקט נמחק בהצלחה' })
                    mutate()
                } else {
                    toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
                }
            } catch (error) {
                toast({ title: 'שגיאה', description: 'אירעה שגיאה במחיקת הפרויקט', variant: 'destructive' })
            }
        }
    }

    const openEdit = (project: Project) => {
        setEditingProject(project)
        setName(project.name)
        setColor(project.color || PRESET_COLORS[0].hex)
        setIsEditOpen(true)
    }

    const resetForm = () => {
        setName('')
        setColor(PRESET_COLORS[0].hex)
        setEditingProject(null)
    }

    const handleProjectClick = async (project: Project) => {
        setIsLoadingDetails(true)
        try {
            const result = await getProjectDetails(project.id)
            if (result.success) {
                setViewProject(result.data)
                setIsDetailsOpen(true)
            } else {
                toast({ title: 'שגיאה', description: 'לא ניתן לטעון פרטי פרויקט', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בטעינת הפרטים', variant: 'destructive' })
        } finally {
            setIsLoadingDetails(false)
        }
    }

    if (error) return <div className="text-center p-10 text-red-500">שגיאה בטעינת פרויקטים</div>

    return (
        <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">פרויקטים</h2>
                    <p className="text-muted-foreground">ניהול ומעקב אחרי פרויקטים אישיים</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button id="projects-add-btn" onClick={() => setIsAddOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        פרויקט חדש
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowTutorial(true)} title="הדרכה">
                        <Info className="h-5 w-5 text-gray-500" />
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="h-[200px]">
                            <CardHeader>
                                <Skeleton className="h-6 w-[150px]" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-10 text-center">
                        <FolderOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="font-semibold text-lg mb-2">אין פרויקטים עדיין</h3>
                        <p className="text-muted-foreground mb-4">צור פרויקט חדש כדי להתחיל לעקוב אחרי הכנסות והוצאות הקשורות אליו.</p>
                        <Button onClick={() => setIsAddOpen(true)} variant="outline">
                            צור פרויקט ראשון
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div id="projects-list" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* @ts-ignore */}
                    {projects.map((project: Project) => (
                        <Card
                            key={project.id}
                            className="hover:shadow-md transition-shadow relative group cursor-pointer"
                            onClick={() => handleProjectClick(project)}
                        >
                            <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); openEdit(project) }}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleDelete(project) }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-10 rounded-full"
                                        style={{ backgroundColor: project.color || '#cccccc' }}
                                    />
                                    <div>
                                        <CardTitle className="text-xl">{project.name}</CardTitle>
                                        <CardDescription className="text-xs">
                                            מאזן כולל
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Wallet className="h-4 w-4" />
                                            <span className="text-sm font-medium">יתרה</span>
                                        </div>
                                        <span className={cn(
                                            "text-lg font-bold dir-ltr",
                                            project.stats.balance > 0 ? "text-green-600" : project.stats.balance < 0 ? "text-red-600" : ""
                                        )}>
                                            {formatCurrency(project.stats.balance)}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1 text-xs">
                                                <ArrowUpCircle className="h-3.5 w-3.5 text-green-500" />
                                                הכנסות
                                            </div>
                                            <div className="text-sm font-semibold dir-ltr">
                                                {formatCurrency(project.stats.totalIncome)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 text-muted-foreground mb-1 text-xs">
                                                <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" />
                                                הוצאות
                                            </div>
                                            <div className="text-sm font-semibold dir-ltr">
                                                {formatCurrency(project.stats.totalExpenses)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Project Dialog */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>פרויקט חדש</DialogTitle>
                        <DialogDescription>
                            צור פרויקט חדש למעקב או ניהול תקציב נפרד.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">שם הפרויקט</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="לדוגמה: שיפוץ דירה, חופשה ביוון..."
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>צבע</Label>
                            <div className="grid grid-cols-8 gap-2">
                                {PRESET_COLORS.map((c) => (
                                    <button
                                        key={c.hex}
                                        type="button"
                                        onClick={() => setColor(c.hex)}
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all ring-offset-2",
                                            color === c.hex ? "ring-2 ring-primary scale-110" : "hover:scale-105"
                                        )}
                                        style={{ backgroundColor: c.hex }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>ביטול</Button>
                        <Button onClick={handleAdd} disabled={!name.trim() || submitting}>
                            {submitting ? 'יוצר...' : 'צור פרויקט'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Project Dialog */}
            <Dialog open={isEditOpen} onOpenChange={(open) => {
                setIsEditOpen(open)
                if (!open) resetForm()
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>ערוך פרויקט</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">שם הפרויקט</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>צבע</Label>
                            <div className="grid grid-cols-8 gap-2">
                                {PRESET_COLORS.map((c) => (
                                    <button
                                        key={c.hex}
                                        type="button"
                                        onClick={() => setColor(c.hex)}
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all ring-offset-2",
                                            color === c.hex ? "ring-2 ring-primary scale-110" : "hover:scale-105"
                                        )}
                                        style={{ backgroundColor: c.hex }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>ביטול</Button>
                        <Button onClick={handleEdit} disabled={!name.trim() || submitting}>
                            {submitting ? 'שומר...' : 'שמור שינויים'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ProjectDetailsDialog
                project={viewProject}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />

            <ProjectsTutorial
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
            />
        </div>
    )
}
