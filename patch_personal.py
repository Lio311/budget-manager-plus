import sys

filename = 'src/components/dashboard/dialogs/ProjectDetailsDialog.tsx'
with open(filename, 'r') as f:
    content = f.read()

import_stmt = "import { ProjectStagesTab } from '../projects/ProjectStagesTab'\n"
content = content.replace("import { ArrowDownLeft, ArrowUpRight, Calendar, FileText, Wallet } from \"lucide-react\"", "import { ArrowDownLeft, ArrowUpRight, Calendar, FileText, Wallet } from \"lucide-react\"\n" + import_stmt)

old_dialog_decl = "export function ProjectDetailsDialog({ project, isOpen, onClose }: ProjectDetailsDialogProps) {"
new_dialog_decl = "export function ProjectDetailsDialog({ project, isOpen, onClose, onUpdate }: ProjectDetailsDialogProps) {"
content = content.replace(old_dialog_decl, new_dialog_decl)

old_tabs_list = """                    <TabsList className="w-full grid grid-cols-2">"""
new_tabs_list = """                    <TabsList className="w-full grid grid-cols-3">"""
content = content.replace(old_tabs_list, new_tabs_list)

old_tabs_trigger = """                        <TabsTrigger value="incomes">הכנסות ({project.incomes?.length || 0})</TabsTrigger>"""
new_tabs_trigger = """                        <TabsTrigger value="incomes">הכנסות ({project.incomes?.length || 0})</TabsTrigger>\n                        <TabsTrigger value="stages">שלבים ({project.stages?.length || 0})</TabsTrigger>"""
content = content.replace(old_tabs_trigger, new_tabs_trigger)

stages_content = """                    <TabsContent value="stages" className="mt-4">
                        <ProjectStagesTab project={project} onUpdate={onUpdate || (() => {})} />
                    </TabsContent>
"""
content = content.replace('                    <TabsContent value="expenses" className="mt-4">', stages_content + '                    <TabsContent value="expenses" className="mt-4">')

with open(filename, 'w') as f:
    f.write(content)
