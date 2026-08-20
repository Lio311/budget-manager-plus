import sys
filename = 'src/components/dashboard/dialogs/BusinessProjectDetailsDialog.tsx'

with open(filename, 'r') as f:
    content = f.read()

# Add import
import_stmt = "import { ProjectStagesTab } from '../projects/ProjectStagesTab'\n"
content = content.replace("import { motion, AnimatePresence } from 'framer-motion'", "import { motion, AnimatePresence } from 'framer-motion'\n" + import_stmt)

# Update TabsList
old_tabs_list = """                        <TabsList className="w-full grid grid-cols-3 h-9 bg-slate-100 dark:bg-slate-800/50">"""
new_tabs_list = """                        <TabsList className="w-full grid grid-cols-4 h-9 bg-slate-100 dark:bg-slate-800/50">"""
content = content.replace(old_tabs_list, new_tabs_list)

old_tabs_trigger = """                            <TabsTrigger value="transactions" className="text-xs">תנועות ({allTransactions.length})</TabsTrigger>"""
new_tabs_trigger = """                            <TabsTrigger value="transactions" className="text-xs">תנועות ({allTransactions.length})</TabsTrigger>\n                            <TabsTrigger value="stages" className="text-xs">שלבים ({project?.stages?.length || 0})</TabsTrigger>"""
content = content.replace(old_tabs_trigger, new_tabs_trigger)

# Add Stages Tab Content
stages_content = """                        <TabsContent value="stages" className="mt-3">
                            <ProjectStagesTab project={project} onUpdate={() => window.location.reload()} />
                        </TabsContent>
"""
content = content.replace('                        <TabsContent value="transactions" className="mt-3">', stages_content + '\n                        <TabsContent value="transactions" className="mt-3">')

with open(filename, 'w') as f:
    f.write(content)
