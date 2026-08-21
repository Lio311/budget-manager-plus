import sys

with open('src/components/dashboard/tabs/ClientDetailsDialog.tsx', 'r') as f:
    content = f.read()

# Add a useEffect to sync selectedProject
sync_effect = """
    // Sync selectedProject when client updates
    import { useEffect } from 'react'
    useEffect(() => {
        if (selectedProject && client?.projects) {
            const updated = client.projects.find((p: any) => p.id === selectedProject.id)
            if (updated) setSelectedProject(updated)
        }
    }, [client?.projects])
"""
# Need to put useEffect inside the component, but we can just use the import correctly.
# It's better to just write the useEffect inside. We already have `import { useState } from "react"`.
# Let's replace that with `import { useState, useEffect } from "react"`.

content = content.replace('import { useState } from "react"', 'import { useState, useEffect } from "react"')

effect_code = """    const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false)
    const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
    const [isCreatingProject, setIsCreatingProject] = useState(false)

    useEffect(() => {
        if (selectedProject && client?.projects) {
            const updated = client.projects.find((p: any) => p.id === selectedProject.id)
            if (updated) setSelectedProject(updated)
        }
    }, [client?.projects])
"""

content = content.replace('    const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false)\n    const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)\n    const [isCreatingProject, setIsCreatingProject] = useState(false)', effect_code)

with open('src/components/dashboard/tabs/ClientDetailsDialog.tsx', 'w') as f:
    f.write(content)
