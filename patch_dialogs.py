import sys

def patch_dialog(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Add onUpdate to props
    content = content.replace("onClose: () => void", "onClose: () => void\n    onUpdate?: () => void")
    
    # Change projectStagesTab to use onUpdate
    content = content.replace("onUpdate={() => window.location.reload()}", "onUpdate={onUpdate}")
    
    with open(filename, 'w') as f:
        f.write(content)

patch_dialog('src/components/dashboard/dialogs/BusinessProjectDetailsDialog.tsx')
patch_dialog('src/components/dashboard/dialogs/ProjectDetailsDialog.tsx')
