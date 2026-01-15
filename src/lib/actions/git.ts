'use server'

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export interface Commit {
    hash: string
    date: string
    message: string
    author: string
}

export interface GitStats {
    commits: Commit[]
    fileStats: { name: string; value: number }[]
    totalFiles: number
}

export async function getGitStats(): Promise<{ success: boolean; data?: GitStats; error?: string }> {
    try {
        // 1. Get Commits (limited to last 2000 to be safe, though users usually want full history)
        // Using a custom separator |~| to avoid conflicts with pipe in commit messages
        const { stdout: logOutput } = await execAsync('git log --pretty=format:"%h|~|%ad|~|%s|~|%an" --date=iso -n 2000')

        const commits = logOutput
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const parts = line.split('|~|')
                if (parts.length < 4) return null
                const [hash, date, message, author] = parts
                return { hash, date, message, author }
            })
            .filter((c): c is Commit => c !== null)

        // 2. Get Files
        const { stdout: filesOutput } = await execAsync('git ls-files')
        const files = filesOutput.split('\n').filter(f => f.trim())

        const statsMap: { [key: string]: number } = {}
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase() || 'no-ext'
            // Clean up slightly (remove leading dot)
            const cleanExt = ext.startsWith('.') ? ext.substring(1) : ext
            statsMap[cleanExt] = (statsMap[cleanExt] || 0) + 1
        })

        // Transform to array for Recharts
        const fileStats = Object.entries(statsMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value) // Sort by count desc

        return {
            success: true,
            data: {
                commits,
                fileStats,
                totalFiles: files.length
            }
        }

    } catch (error) {
        console.error('Git stats error:', error)
        // In case git is not installed or not a repo
        return { success: false, error: 'Failed to fetch git stats. Make sure git is installed.' }
    }
}
