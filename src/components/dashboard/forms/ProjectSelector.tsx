'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PRESET_COLORS } from '@/lib/constants'

interface Project {
    id: string
    name: string
    color: string | null
}

interface ProjectSelectorProps {
    projects: Project[]
    selectedProjectId: string
    onProjectIdChange: (id: string) => void
    onAddProject: (name: string, color: string) => Promise<void>
    placeholder?: string
    error?: boolean
}

export function ProjectSelector({
    projects,
    selectedProjectId,
    onProjectIdChange,
    onAddProject,
    placeholder = "חפש פרויקט...",
    error
}: ProjectSelectorProps) {
    const [open, setOpen] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newProjectName, setNewProjectName] = useState('')
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].hex)
    const [adding, setAdding] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedProject = projects.find(p => p.id === selectedProjectId)

    // Handle click outside to close the dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
                setShowAddForm(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const [inputValue, setInputValue] = useState(selectedProject ? selectedProject.name : "")

    // Sync input value with selected project
    useEffect(() => {
        setInputValue(selectedProject ? selectedProject.name : "")
    }, [selectedProject])

    const handleAddProject = async () => {
        if (!newProjectName.trim()) return

        setAdding(true)
        try {
            await onAddProject(newProjectName.trim(), selectedColor)
            setNewProjectName('')
            setSelectedColor(PRESET_COLORS[0].hex)
            setShowAddForm(false)
        } finally {
            setAdding(false)
        }
    }

    return (
        <div ref={containerRef} dir="rtl" className="relative">
            <Command
                className="rounded-lg border shadow-sm overflow-visible bg-white dark:bg-slate-800 [&_[cmdk-input-wrapper]]:flex-row-reverse [&_[cmdk-input-wrapper]_svg]:ml-2 [&_[cmdk-input-wrapper]_svg]:mr-0"
            >
                <CommandInput
                    placeholder={placeholder}
                    value={inputValue}
                    onValueChange={setInputValue}
                    onFocus={() => setOpen(true)}
                    className={cn(
                        "text-right h-10 text-base md:text-sm",
                        error && "border-red-500 ring-1 ring-red-500/20 rounded-md"
                    )}
                />
                {open && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-lg border bg-popover shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                        {!showAddForm ? (
                            <CommandList className="max-h-[300px]">
                                <CommandEmpty>לא נמצאו פרויקטים</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        value="NO_PROJECT"
                                        onSelect={() => {
                                            onProjectIdChange('')
                                            setInputValue('')
                                            setOpen(false)
                                        }}
                                        className="text-right cursor-pointer flex flex-row-reverse justify-between"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                !selectedProjectId ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        ללא פרויקט מקושר
                                    </CommandItem>
                                    {projects.map((project) => (
                                        <CommandItem
                                            key={project.id}
                                            value={project.name}
                                            onSelect={() => {
                                                onProjectIdChange(project.id)
                                                setInputValue(project.name)
                                                setOpen(false)
                                            }}
                                            className="text-right cursor-pointer flex flex-row-reverse justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Check
                                                    className={cn(
                                                        "h-4 w-4",
                                                        selectedProjectId === project.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: project.color || '#cccccc' }}
                                                />
                                            </div>
                                            {project.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                <div className="p-2 border-t">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => setShowAddForm(true)}
                                    >
                                        <Plus className="h-4 w-4 ml-2" />
                                        הוסף פרויקט חדש
                                    </Button>
                                </div>
                            </CommandList>
                        ) : (
                            <div className="p-4 space-y-3">
                                <h4 className="font-medium text-sm">פרויקט חדש</h4>
                                <Input
                                    placeholder="שם הפרויקט"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    className="text-right"
                                    autoFocus
                                />
                                <div>
                                    <label className="text-xs font-medium mb-2 block">בחר צבע</label>
                                    <div className="grid grid-cols-8 gap-2">
                                        {PRESET_COLORS.map((colorObj) => (
                                            <button
                                                key={colorObj.hex}
                                                type="button"
                                                onClick={() => setSelectedColor(colorObj.hex)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full transition-all",
                                                    selectedColor === colorObj.hex && "ring-2 ring-offset-2 ring-blue-500"
                                                )}
                                                style={{ backgroundColor: colorObj.hex }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleAddProject}
                                        disabled={!newProjectName.trim() || adding}
                                        className="flex-1"
                                    >
                                        {adding ? 'מוסיף...' : 'הוסף'}
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddForm(false)
                                            setNewProjectName('')
                                            setSelectedColor(PRESET_COLORS[0].hex)
                                        }}
                                    >
                                        ביטול
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Command>
            {error && <p className="text-red-500 text-xs text-right mt-1">שדה חובה</p>}
        </div>
    )
}
