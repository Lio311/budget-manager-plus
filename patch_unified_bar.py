import sys

filename = 'src/components/dashboard/projects/ProjectStagesTab.tsx'
with open(filename, 'r') as f:
    content = f.read()

unified_bar_code = """            {stages.length > 0 && (
                <div className="mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold">ציר זמן והתקדמות הפרויקט</span>
                        <span className="text-xs font-medium text-muted-foreground">{totalPercentage}% תוכנן</span>
                    </div>
                    
                    {/* The Unified Bar */}
                    <div className="h-6 w-full bg-slate-200 dark:bg-slate-800 rounded-lg flex overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
                        {stages.map((stage: any, idx: number) => {
                            const stageBudget = (budget * stage.percentage) / 100
                            const stageExpenses = (project.expenses || []).filter((e: any) => e.projectStageId === stage.id).reduce((sum: number, e: any) => sum + e.amount, 0)
                            const progressValue = stageBudget > 0 ? Math.min(100, (stageExpenses / stageBudget) * 100) : 0
                            
                            const colors = [
                                "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
                                "bg-pink-500", "bg-rose-500", "bg-red-500", "bg-orange-500", "bg-amber-500",
                                "bg-yellow-500", "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500"
                            ]
                            const color = colors[idx % colors.length]
                            
                            return (
                                <div 
                                    key={stage.id} 
                                    style={{ width: `${stage.percentage}%` }}
                                    className={`h-full relative ${idx !== 0 ? 'border-r border-white/30 dark:border-black/30' : ''}`}
                                    title={`${stage.title}: ${progressValue.toFixed(0)}% הושלם`}
                                >
                                    {/* The filled progress inside this stage's allocated space */}
                                    <div 
                                        className={`h-full ${color} opacity-90`}
                                        style={{ width: `${progressValue}%`, transition: 'width 0.5s ease-in-out' }}
                                    />
                                </div>
                            )
                        })}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                        {stages.map((stage: any, idx: number) => {
                            const colors = [
                                "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-fuchsia-500",
                                "bg-pink-500", "bg-rose-500", "bg-red-500", "bg-orange-500", "bg-amber-500",
                                "bg-yellow-500", "bg-lime-500", "bg-green-500", "bg-emerald-500", "bg-teal-500"
                            ]
                            const color = colors[idx % colors.length]
                            
                            return (
                                <div key={stage.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                    <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
                                    <span>{stage.title}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {stages.length === 0 ? ("""

content = content.replace("            {stages.length === 0 ? (", unified_bar_code)

with open(filename, 'w') as f:
    f.write(content)
