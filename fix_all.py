import sys

# 1. Fix ClientDetailsDialog.tsx
with open('src/components/dashboard/tabs/ClientDetailsDialog.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { addBusinessProject }', 'import { createBusinessProject }')
content = content.replace('addBusinessProject(data)', 'createBusinessProject(data)')
content = content.replace('isLoading={isCreatingProject}', 'projects={[]}')

with open('src/components/dashboard/tabs/ClientDetailsDialog.tsx', 'w') as f:
    f.write(content)

# 2. Fix clients.ts
with open('src/lib/actions/clients.ts', 'r') as f:
    content = f.read()

content = content.replace('where: { isDeleted: false },\n                        select:', 'select:')
content = content.replace('projects: {\n                                where: { isDeleted: false }\n                            },', 'projects: true,')

with open('src/lib/actions/clients.ts', 'w') as f:
    f.write(content)

