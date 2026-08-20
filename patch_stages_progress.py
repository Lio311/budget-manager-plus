import sys

filename = 'src/components/dashboard/projects/ProjectStagesTab.tsx'
with open(filename, 'r') as f:
    content = f.read()

old_snippet = """                            <Progress value={stage.percentage} className="h-1.5" />
                            {budget > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-1.5 text-left dir-ltr">
                                    ₪{((budget * stage.percentage) / 100).toLocaleString('he-IL', { maximumFractionDigits: 0 })}
                                </p>
                            )}
                        </div>
                    ))}"""

new_snippet = """                            {(() => {
                                const stageBudget = (budget * stage.percentage) / 100
                                const stageIncomes = (project.incomes || []).filter((i: any) => i.projectStageId === stage.id).reduce((sum: number, i: any) => sum + i.amount, 0)
                                const stageExpenses = (project.expenses || []).filter((e: any) => e.projectStageId === stage.id).reduce((sum: number, e: any) => sum + e.amount, 0)
                                const progressValue = stageBudget > 0 ? Math.min(100, (stageExpenses / stageBudget) * 100) : 0
                                
                                return (
                                    <>
                                        <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1 mt-3">
                                            <span>ניצול תקציב השלב</span>
                                            <span className={progressValue > 90 ? "text-red-500" : progressValue > 70 ? "text-amber-500" : "text-green-500"}>
                                                {progressValue.toFixed(0)}%
                                            </span>
                                        </div>
                                        <Progress value={progressValue} className="h-1.5" />
                                        
                                        <div className="flex justify-between items-center mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground">הוצאות בשלב</span>
                                                <span className="text-xs font-semibold text-red-500 dir-ltr">₪{stageExpenses.toLocaleString('he-IL', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-muted-foreground">הכנסות בשלב</span>
                                                <span className="text-xs font-semibold text-green-500 dir-ltr">₪{stageIncomes.toLocaleString('he-IL', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                            <div className="flex flex-col text-left">
                                                <span className="text-[10px] text-muted-foreground">תקציב השלב ({stage.percentage}%)</span>
                                                <span className="text-xs font-semibold dir-ltr">₪{stageBudget.toLocaleString('he-IL', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    ))}"""

content = content.replace(old_snippet, new_snippet)

with open(filename, 'w') as f:
    f.write(content)
