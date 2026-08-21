import sys

with open('src/components/dashboard/tabs/ClientDetailsDialog.tsx', 'r') as f:
    content = f.read()

# Fix imports
content = content.replace('import { ProjectDialog } from "../dialogs/ProjectDialog"', 'import { BusinessProjectFormDialog } from "../dialogs/BusinessProjectFormDialog"\nimport { addBusinessProject } from "@/lib/actions/business-projects"\nimport { toast } from "@/hooks/use-toast"')

# Add isCreating state
content = content.replace('const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)', 'const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)\n    const [isCreatingProject, setIsCreatingProject] = useState(false)')

# Add submit handler
submit_handler = """
    const handleCreateProject = async (data: any) => {
        setIsCreatingProject(true)
        try {
            const result = await addBusinessProject(data)
            if (result.success) {
                toast({ title: 'הפרויקט נוסף בהצלחה' })
                setIsNewProjectOpen(false)
                if (onUpdate) onUpdate()
            } else {
                toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'שגיאה', description: 'שגיאת מערכת', variant: 'destructive' })
        }
        setIsCreatingProject(false)
    }
"""
content = content.replace('if (!client) return null', submit_handler + '\n    if (!client) return null')

# Fix ProjectDialog to BusinessProjectFormDialog
old_project_dialog = """        {/* New Project Modal */}
        <ProjectDialog 
            isOpen={isNewProjectOpen}
            onClose={() => setIsNewProjectOpen(false)}
            onProjectAdded={() => {
                if (onUpdate) onUpdate()
            }}
            budgetType="BUSINESS"
            preselectedClientId={client.id}
        />"""

new_project_dialog = """        {/* New Project Modal */}
        <BusinessProjectFormDialog 
            isOpen={isNewProjectOpen}
            onClose={() => setIsNewProjectOpen(false)}
            onSubmit={handleCreateProject}
            clients={[{ id: client.id, name: client.name }]}
            initialData={{ name: '', status: 'ACTIVE', clientId: client.id, color: '#3B82F6' }}
            isLoading={isCreatingProject}
        />"""

content = content.replace(old_project_dialog, new_project_dialog)

with open('src/components/dashboard/tabs/ClientDetailsDialog.tsx', 'w') as f:
    f.write(content)

