'use server'

import { spawn } from 'child_process'
import path from 'path'

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

// Hardcoded path based on environment discovery
const GIT_PATH = String.raw`C:\Users\Lior\anaconda3\Library\bin\git.exe`

function runGitCommand(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Use shell: true to help resolve git on Windows if it's in PATH but not easily found by direct spawn
        const child = spawn(GIT_PATH, args, { cwd, shell: true })
        let stdout = ''
        let stderr = ''

        child.stdout.on('data', data => stdout += data.toString())
        child.stderr.on('data', data => stderr += data.toString())

        child.on('close', code => {
            if (code === 0) {
                resolve(stdout)
            } else {
                reject(new Error(`Git command failed with code ${code}\nStderr: ${stderr}`))
            }
        })

        child.on('error', err => reject(err))
    })
}

export async function getGitStats(): Promise<{ success: boolean; data?: GitStats; error?: string }> {
    try {
        const cwd = process.cwd()
        console.log('[GitStats] CWD:', cwd)

        // 1. Get Commits
        // Pass arguments as array to avoid shell quoting issues on Windows
        // Format: hash __SEP__ date __SEP__ message __SEP__ author
        // We wrap the format string in quotes because shell:true is enabled
        const logOutput = await runGitCommand([
            'log',
            '"--pretty=format:%h__SEP__%ad__SEP__%s__SEP__%an"',
            '--date=iso',
            '-n', '2000'
        ], cwd)

        const commits = logOutput
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
                const parts = line.split('__SEP__')
                if (parts.length < 4) return null
                const [hash, date, message, author] = parts
                return { hash, date, message, author }
            })
            .filter((c): c is Commit => c !== null)

        // 2. Get Files
        const filesOutput = await runGitCommand(['ls-files'], cwd)
        const files = filesOutput.split('\n').filter(f => f.trim())

        const statsMap: { [key: string]: number } = {}
        files.forEach(file => {
            const ext = path.extname(file).toLowerCase() || 'no-ext'
            // Clean up
            const cleanExt = ext.startsWith('.') ? ext.substring(1) : ext
            statsMap[cleanExt] = (statsMap[cleanExt] || 0) + 1
        })

        // Transform to array
        const fileStats = Object.entries(statsMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)

        return {
            success: true,
            data: {
                commits,
                fileStats,
                totalFiles: files.length
            }
        }

    } catch (error: any) {
        console.error('[GitStats] Error details:', {
            message: error.message,
            stack: error.stack,
            cmd: error.cmd,
            code: error.code,
            stderr: error.stderr
        })

        // Specific error message for common issues
        if (error.stderr?.includes('not a git repository')) {
            return { success: false, error: 'Not a git repository (or .git folder missing).' }
        }

        return { success: false, error: `Failed to fetch git stats: ${error.message}` }
    }
}
