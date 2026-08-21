import sys

with open('src/components/dashboard/tabs/ClientsTab.tsx', 'r') as f:
    content = f.read()

old_code = """                                {/* Document Counts & Projects */}
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

new_code = """                                {/* Document Counts & Projects */}
                                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                                    <div className="flex flex-col items-center justify-center text-center group" title="פרויקטים">
                                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/10 px-2 py-1 rounded-md w-full justify-center group-hover:bg-blue-100 transition-colors">
                                            <FolderGit2 className="h-4 w-4 text-blue-600" />
                                            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">{client._count?.projects || 0}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1">פרויקטים</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-center group" title="הצעת מחיר">
                                        <div className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/10 px-2 py-1 rounded-md w-full justify-center group-hover:bg-yellow-100 transition-colors">
                                            <FileText className="h-4 w-4 text-yellow-600" />
                                            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">{client.quotesCount || 0}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1">הצעות מחיר</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-center group" title="חשבונית">
                                        <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-900/10 px-2 py-1 rounded-md w-full justify-center group-hover:bg-purple-100 transition-colors">
                                            <Receipt className="h-4 w-4 text-purple-600" />
                                            <span className="text-xs font-medium text-purple-700 dark:text-purple-400">{client.invoicesCount || 0}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1">חשבוניות</span>
                                    </div>
                                    <div className="flex flex-col items-center justify-center text-center group" title="זיכוי">
                                        <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/10 px-2 py-1 rounded-md w-full justify-center group-hover:bg-orange-100 transition-colors">
                                            <CreditCard className="h-4 w-4 text-orange-600" />
                                            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">{client.creditNotesCount || 0}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-500 mt-1">זיכויים</span>
                                    </div>
                                </div>"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open('src/components/dashboard/tabs/ClientsTab.tsx', 'w') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Could not find old code")
