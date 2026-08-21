import sys

with open('src/components/dashboard/tabs/ClientsTab.tsx', 'r') as f:
    content = f.read()

# Add FolderGit2 to imports
content = content.replace("Info, Loader2 } from 'lucide-react'", "Info, Loader2, FolderGit2 } from 'lucide-react'")

# Add to bottom row
old_bottom_row = """                                {/* Document Counts */}
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-1" title="הצעת מחיר">
                                        <FileText className="h-3.5 w-3.5 text-yellow-600" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{client.quotesCount || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="חשבונית">
                                        <Receipt className="h-3.5 w-3.5 text-purple-600" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{client.invoicesCount || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="זיכוי">
                                        <CreditCard className="h-3.5 w-3.5 text-orange-600" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{client.creditNotesCount || 0}</span>
                                    </div>

                                </div>"""
new_bottom_row = """                                {/* Document Counts & Projects */}
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center gap-1" title="פרויקטים">
                                        <FolderGit2 className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{client._count?.projects || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="הצעת מחיר">
                                        <FileText className="h-3.5 w-3.5 text-yellow-600" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{client.quotesCount || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="חשבונית">
                                        <Receipt className="h-3.5 w-3.5 text-purple-600" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{client.invoicesCount || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="זיכוי">
                                        <CreditCard className="h-3.5 w-3.5 text-orange-600" />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{client.creditNotesCount || 0}</span>
                                    </div>
                                </div>"""

content = content.replace(old_bottom_row, new_bottom_row)

with open('src/components/dashboard/tabs/ClientsTab.tsx', 'w') as f:
    f.write(content)
