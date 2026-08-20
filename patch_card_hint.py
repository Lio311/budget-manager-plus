import sys

def patch_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    old_snippet = """                    )}
                </CardContent>
            </Card>"""
            
    new_snippet = """                    )}
                    
                    <div className="mt-3 pt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                            <Info className="w-3 h-3" /> לחץ לפרטים המלאים ולניהול שלבים
                        </span>
                    </div>
                </CardContent>
            </Card>"""
    
    if old_snippet in content:
        content = content.replace(old_snippet, new_snippet)
        
    old_snippet_personal = """                                    </div>
                                </div>
                            </CardContent>
                        </Card>"""
                        
    new_snippet_personal = """                                    </div>
                                </div>
                                <div className="mt-3 pt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                                        <Info className="w-3 h-3" /> לחץ לפרטים המלאים ולניהול שלבים
                                    </span>
                                </div>
                            </CardContent>
                        </Card>"""
                        
    if old_snippet_personal in content:
        content = content.replace(old_snippet_personal, new_snippet_personal)

    with open(filename, 'w') as f:
        f.write(content)

patch_file('src/components/dashboard/tabs/BusinessProjectsTab.tsx')
patch_file('src/components/dashboard/tabs/ProjectsTab.tsx')
