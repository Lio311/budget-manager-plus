import sys

def fix_file(filename, fetch_func, import_str):
    with open(filename, 'r') as f:
        content = f.read()
    
    if import_str not in content:
        # Add import for the detail fetch func if missing, but they are likely already imported.
        pass

    # BusinessProjectsTab
    if 'BusinessProjectsTab' in filename:
        old = """                onUpdate={async () => {
                    const newProjects = await mutate();
                    if (newProjects && detailsProject) {
                        const updated = newProjects.data?.find((p: any) => p.id === detailsProject.id);
                        if (updated) setDetailsProject(updated);
                    }
                }}"""
        new = """                onUpdate={async () => {
                    await mutate();
                    if (detailsProject) {
                        const res = await getBusinessProjectDetails(detailsProject.id);
                        if (res.success) setDetailsProject(res.data);
                    }
                }}"""
        content = content.replace(old, new)
        
    # ProjectsTab
    if 'ProjectsTab' in filename:
        old = """                onUpdate={async () => {
                    const newProjects = await mutate();
                    if (newProjects && viewProject) {
                        const updated = newProjects.data?.find((p: any) => p.id === viewProject.id);
                        if (updated) setViewProject(updated);
                    }
                }}"""
        new = """                onUpdate={async () => {
                    await mutate();
                    if (viewProject) {
                        const res = await getProjectDetails(viewProject.id);
                        if (res.success) setViewProject(res.data);
                    }
                }}"""
        content = content.replace(old, new)

    with open(filename, 'w') as f:
        f.write(content)

fix_file('src/components/dashboard/tabs/BusinessProjectsTab.tsx', 'getBusinessProjectDetails', '')
fix_file('src/components/dashboard/tabs/ProjectsTab.tsx', 'getProjectDetails', '')
