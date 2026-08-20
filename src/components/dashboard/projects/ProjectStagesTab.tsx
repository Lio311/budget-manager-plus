'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { ProjectStageDialog } from '../dialogs/ProjectStageDialog'
import { deleteProjectStage } from '@/lib/actions/project-stages'
import { toast } from '@/hooks/use-toast'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function ProjectStagesTab({ project, onUpdate }: { project: any, onUpdate: () => void }) {
    const [isStageDialogOpen, setIsStageDialogOpen] = useState(false)
    const [stageToEdit, setStageToEdit] = useState<any>(null)
    const [stageToDelete, setStageToDelete] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    
    const stages = project.stages || []
    const totalPercentage = stages.reduce((sum: number, s: any) => sum + s.percentage, 0)
    const budget = project.budget || 0

    const handleDelete = async (deleteLinked: boolean) => {
        if (!stageToDelete) return
        
        setIsDeleting(true)
        const result = await deleteProjectStage(stageToDelete.id, deleteLinked)
        if (result.success) {
            toast({ title: 'שלב נמחק בהצלחה' })
            onUpdate()
            setStageToDelete(null)
        } else {
            toast({ title: 'שגיאה במחיקת שלב', description: result.error, variant: 'destructive' })
        }
        setIsDeleting(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold">שלבי הפרויקט</h4>
                    <p className="text-xs text-muted-foreground">סך הכל נוצלו {totalPercentage}% מתוך 100%</p>
                </div>
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8"
                    onClick={() => {
                        setStageToEdit(null)
                        setIsStageDialogOpen(true)
                    }}
                    disabled={totalPercentage >= 100 || stages.length >= 15}
                >
                    <Plus className="h-3.5 w-3.5 ml-1" />
                    הוסף שלב
                </Button>
            </div>

            {stages.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">לא הוגדרו שלבים לפרויקט זה.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {stages.map((stage: any) => (
                        <div key={stage.id} className="p-3 bg-white dark:bg-slate-950 border rounded-lg shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">{stage.title}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold">{stage.percentage}%</span>
                                    <div className="flex items-center border-r pr-2 gap-1">
                                        <button 
                                            onClick={() => {
                                                setStageToEdit(stage)
                                                setIsStageDialogOpen(true)
                                            }}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100"
                                        >
                                            <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button 
                                            onClick={() => setStageToDelete(stage)}
                                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 hover:text-red-600"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <Progress value={stage.percentage} className="h-1.5" />
                            {budget > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-1.5 text-left dir-ltr">
                                    ₪{((budget * stage.percentage) / 100).toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ProjectStageDialog 
                isOpen={isStageDialogOpen}
                onClose={() => setIsStageDialogOpen(false)}
                project={project}
                initialData={stageToEdit}
                onSuccess={() => {
                    setIsStageDialogOpen(false)
                    onUpdate()
                }}
            />

            <AlertDialog open={!!stageToDelete} onOpenChange={(open) => !open && setStageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>מחיקת שלב בפרויקט</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם תרצה למחוק רק את השלב (ולשמור את ההוצאות וההכנסות המקושרות תחת הפרויקט הכללי), או למחוק גם את כל התנועות המקושרות לשלב זה?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
                        <AlertDialogCancel disabled={isDeleting}>ביטול</AlertDialogCancel>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => handleDelete(false)} disabled={isDeleting}>
                                מחק שלב בלבד
                            </Button>
                            <Button variant="destructive" onClick={() => handleDelete(true)} disabled={isDeleting}>
                                מחק שלב ותנועות
                            </Button>
                        </div>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
