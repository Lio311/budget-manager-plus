import sys

with open('src/components/dashboard/tabs/ClientsTab.tsx', 'r') as f:
    content = f.read()

# Add to Card layout
# Look for: <div className="space-y-2 mt-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-slate-700 pt-3">
old_card_info = """                                <div className="space-y-2 mt-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-slate-700 pt-3">"""
new_card_info = """                                <div className="space-y-2 mt-4 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-slate-700 pt-3">
                                    {(client._count?.projects || 0) > 0 && (
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder h-4 w-4 shrink-0 text-blue-500"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                                            <span className="truncate">{client._count.projects} פרויקטים</span>
                                        </div>
                                    )}"""

if old_card_info in content:
    content = content.replace(old_card_info, new_card_info)


# Add to List layout
old_list_info = """                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">"""
new_list_info = """                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    {(client._count?.projects || 0) > 0 && (
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder h-3 w-3 shrink-0 text-blue-500"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>
                                                            <span>{client._count.projects} פרויקטים</span>
                                                        </div>
                                                    )}"""

if old_list_info in content:
    content = content.replace(old_list_info, new_list_info)

with open('src/components/dashboard/tabs/ClientsTab.tsx', 'w') as f:
    f.write(content)

