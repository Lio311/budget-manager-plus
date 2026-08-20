import sys

def patch_tab(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Find the dialog and add onUpdate
    if "BusinessProjectDetailsDialog" in content:
        old_dialog = """            <BusinessProjectDetailsDialog
                project={detailsProject}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />"""
        new_dialog = """            <BusinessProjectDetailsDialog
                project={detailsProject}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                onUpdate={async () => {
                    const newProjects = await mutate();
                    if (newProjects && detailsProject) {
                        const updated = newProjects.find((p: any) => p.id === detailsProject.id);
                        if (updated) setDetailsProject(updated);
                    }
                }}
            />"""
        content = content.replace(old_dialog, new_dialog)
        
    if "ProjectDetailsDialog" in content and "BusinessProjectDetailsDialog" not in content:
        old_dialog = """            <ProjectDetailsDialog
                project={detailsProject}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
            />"""
        new_dialog = """            <ProjectDetailsDialog
                project={detailsProject}
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                onUpdate={async () => {
                    const newProjects = await mutate();
                    if (newProjects && detailsProject) {
                        const updated = newProjects.find((p: any) => p.id === detailsProject.id);
                        if (updated) setDetailsProject(updated);
                    }
                }}
            />"""
        content = content.replace(old_dialog, new_dialog)

    with open(filename, 'w') as f:
        f.write(content)

patch_tab('src/components/dashboard/tabs/BusinessProjectsTab.tsx')
patch_tab('src/components/dashboard/tabs/ProjectsTab.tsx')
