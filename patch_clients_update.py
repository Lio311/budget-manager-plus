import sys

with open('src/components/dashboard/tabs/ClientsTab.tsx', 'r') as f:
    content = f.read()

old_dialog = """            <ClientDetailsDialog
                client={selectedClientDetails}
                isOpen={!!selectedClientDetails}
                onClose={() => setSelectedClientDetails(null)}
            />"""

new_dialog = """            <ClientDetailsDialog
                client={selectedClientDetails}
                isOpen={!!selectedClientDetails}
                onClose={() => setSelectedClientDetails(null)}
                onUpdate={async () => {
                    const freshData = await mutate();
                    if (freshData && selectedClientDetails) {
                        const updated = freshData.find((c: any) => c.id === selectedClientDetails.id);
                        if (updated) setSelectedClientDetails(updated);
                    }
                }}
            />"""

if old_dialog in content:
    content = content.replace(old_dialog, new_dialog)

with open('src/components/dashboard/tabs/ClientsTab.tsx', 'w') as f:
    f.write(content)
