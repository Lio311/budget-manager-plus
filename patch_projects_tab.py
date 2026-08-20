import sys

filename = 'src/components/dashboard/tabs/ProjectsTab.tsx'
with open(filename, 'r') as f:
    content = f.read()

old_dialog = """            <ProjectDetailsDialog
                project={viewProject}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />"""
new_dialog = """            <ProjectDetailsDialog
                project={viewProject}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                onUpdate={async () => {
                    const newProjects = await mutate();
                    if (newProjects && viewProject) {
                        const updated = newProjects.find((p: any) => p.id === viewProject.id);
                        if (updated) setViewProject(updated);
                    }
                }}
            />"""

content = content.replace(old_dialog, new_dialog)

with open(filename, 'w') as f:
    f.write(content)
