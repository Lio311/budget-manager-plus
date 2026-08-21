import sys
import re

with open('src/components/dashboard/tabs/ClientDetailsDialog.tsx', 'r') as f:
    content = f.read()

# Add imports
imports_to_add = """
import { FolderGit2, Plus } from "lucide-react"
import { useState } from "react"
import { BusinessProjectDetailsDialog } from "../dialogs/BusinessProjectDetailsDialog"
import { ProjectDialog } from "../dialogs/ProjectDialog"
import { Button } from "@/components/ui/button"
"""
content = content.replace("import { Building2", imports_to_add + "import { Building2")

# Add onUpdate to props
content = content.replace("onClose: () => void", "onClose: () => void\n    onUpdate?: () => void")
content = content.replace("isOpen, onClose }: ClientDetailsDialogProps", "isOpen, onClose, onUpdate }: ClientDetailsDialogProps")

# Add state
states_to_add = """    const [selectedProject, setSelectedProject] = useState<any>(null)
    const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false)
    const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)

"""
content = content.replace("if (!client) return null", states_to_add + "    if (!client) return null")


# Change grid-cols-3 to grid-cols-4 and add Project Stats Card
old_stats = """                    {/* Document Stats Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/20 flex flex-col items-center justify-center gap-1">"""
new_stats = """                    {/* Document Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20 flex flex-col items-center justify-center gap-1">
                            <FolderGit2 className="h-5 w-5 text-blue-600" />
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{client._count?.projects || 0}</span>
                            <span className="text-xs text-gray-500">פרויקטים</span>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/20 flex flex-col items-center justify-center gap-1">"""
content = content.replace(old_stats, new_stats)

# Add Projects list section
old_contact = """                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">"""
new_projects_section = """                    {/* Projects Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">הפרויקטים של הלקוח</h4>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                                onClick={() => setIsNewProjectOpen(true)}
                            >
                                <Plus className="h-3.5 w-3.5 ml-1" />
                                פרויקט חדש
                            </Button>
                        </div>
                        
                        {client.projects && client.projects.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {client.projects.map((project: any) => (
                                    <div 
                                        key={project.id}
                                        onClick={() => {
                                            setSelectedProject(project)
                                            setIsProjectDetailsOpen(true)
                                        }}
                                        className="p-3 bg-white dark:bg-slate-900 border rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all flex justify-between items-center group"
                                    >
                                        <div className="overflow-hidden">
                                            <h5 className="font-medium text-sm truncate pr-1">{project.name}</h5>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                <Badge variant="outline" className={`text-[10px] h-4 px-1.5 py-0 ${
                                                    project.status === 'COMPLETED' ? 'border-green-500 text-green-600' :
                                                    project.status === 'CANCELLED' ? 'border-red-500 text-red-600' :
                                                    project.status === 'ON_HOLD' ? 'border-orange-500 text-orange-600' :
                                                    'border-blue-500 text-blue-600'
                                                }`}>
                                                    {project.status === 'COMPLETED' ? 'הושלם' :
                                                     project.status === 'CANCELLED' ? 'בוטל' :
                                                     project.status === 'ON_HOLD' ? 'בהמתנה' :
                                                     'פעיל'}
                                                </Badge>
                                                <span>₪{project.budget?.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed">
                                <p className="text-sm text-muted-foreground">לא נמצאו פרויקטים ללקוח זה.</p>
                            </div>
                        )}
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">"""
content = content.replace(old_contact, new_projects_section)


# Add the dialogs outside the main Dialog content
old_return = """        </Dialog>
    )
}"""
new_return = """        </Dialog>
        
        {/* Project Details Modal - Opens ON TOP of Client Modal */}
        {selectedProject && (
            <BusinessProjectDetailsDialog 
                project={selectedProject}
                isOpen={isProjectDetailsOpen}
                onClose={() => {
                    setIsProjectDetailsOpen(false)
                    setSelectedProject(null)
                }}
                onUpdate={() => {
                    if (onUpdate) onUpdate()
                }}
            />
        )}
        
        {/* New Project Modal */}
        <ProjectDialog 
            isOpen={isNewProjectOpen}
            onClose={() => setIsNewProjectOpen(false)}
            onProjectAdded={() => {
                if (onUpdate) onUpdate()
            }}
            budgetType="BUSINESS"
            preselectedClientId={client.id}
        />
        </>
    )
}"""
content = content.replace(old_return, new_return)
content = content.replace("return (\n        <Dialog", "return (\n        <>\n        <Dialog")

with open('src/components/dashboard/tabs/ClientDetailsDialog.tsx', 'w') as f:
    f.write(content)
