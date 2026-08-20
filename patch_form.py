import sys

def patch_file(filename, form_state_name):
    with open(filename, 'r') as f:
        content = f.read()
    
    # 1. Update onProjectIdChange
    old_change = f"onProjectIdChange={{(id) => set{form_state_name}({{ ...{form_state_name.lower()}, projectId: id }})}}"
    new_change = f"onProjectIdChange={{(id) => set{form_state_name}({{ ...{form_state_name.lower()}, projectId: id, projectStageId: '' }})}}"
    content = content.replace(old_change, new_change)
    
    # 2. Add ProjectStage select
    stage_select_ui = f"""                            />
                        </div>
                        
                        {{{form_state_name.lower()}.projectId && projects.find(p => p.id === {form_state_name.lower()}.projectId)?.stages?.length > 0 && (
                            <div className="md:col-span-1 space-y-1">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">שייך לשלב פרויקט (אופציונלי)</label>
                                <Select
                                    value={{(any({form_state_name.lower()})).projectStageId || ''}}
                                    onValueChange={{(val) => set{form_state_name}({{ ...{form_state_name.lower()}, projectStageId: val === 'none' ? '' : val }})}}
                                >
                                    <SelectTrigger className="w-full h-10 border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                                        <SelectValue placeholder="בחר שלב..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">ללא שלב</SelectItem>
                                        {{projects.find(p => p.id === {form_state_name.lower()}.projectId)?.stages.map((stage: any) => (
                                            <SelectItem key={{stage.id}} value={{stage.id}}>
                                                {{stage.title}} ({{stage.percentage}}%)
                                            </SelectItem>
                                        ))}}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}}"""
    
    content = content.replace("                            />\n                        </div>", stage_select_ui)
    
    # 3. Add any(...) cast to get around TS issues where we used any
    content = content.replace(f"any({form_state_name.lower()})", f"{form_state_name.lower()} as any")

    with open(filename, 'w') as f:
        f.write(content)

patch_file('src/components/dashboard/forms/ExpenseForm.tsx', 'NewExpense')
patch_file('src/components/dashboard/forms/IncomeForm.tsx', 'NewIncome')
