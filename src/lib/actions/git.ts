'use server'

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

const GITHUB_REPO = 'Lio311/budget-manager-plus'

export async function getGitStats(): Promise<{ success: boolean; data?: GitStats; error?: string }> {
    try {
        // 1. Fetch Commits from GitHub API (Fetch ALL commits for accurate stats)
        // Note: For very large repos this might need optimization, but for ~2000 commits it's fine.
        let allCommits: any[] = []
        let page = 1
        const PER_PAGE = 100

        while (true) {
            const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=${PER_PAGE}&page=${page}`, {
                next: { revalidate: 300 }
            })

            if (!res.ok) break
            const data = await res.json()

            if (!data || data.length === 0) break

            allCommits = allCommits.concat(data)

            // Safety break to prevent infinite loops if something goes wrong, though 50 pages = 5000 commits
            if (data.length < PER_PAGE || page >= 50) break
            page++
        }

        const commits: Commit[] = allCommits.map((c: any) => ({
            hash: c.sha,
            date: c.commit.author.date,
            message: c.commit.message,
            author: c.commit.author.name
        }))

        // 2. Fetch Languages
        const languagesResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/languages`, {
            next: { revalidate: 3600 }
        })

        if (!languagesResponse.ok) {
            throw new Error(`GitHub Languages API Error: ${languagesResponse.statusText}`)
        }

        const languagesData = await languagesResponse.json()

        // Transform languages byte count to specific "file count" approximation or just usage share
        // For the visual, we will use the byte count as "value" which works for the Pie Chart share
        const fileStats = Object.entries(languagesData)
            .map(([name, value]) => ({ name, value: value as number }))
            .sort((a, b) => b.value - a.value)

        return {
            success: true,
            data: {
                commits,
                fileStats,
                totalFiles: commits.length
            }
        }

    } catch (error: any) {
        console.error('[GitStats] API Error:', error)
        return { success: false, error: `Failed to fetch GitHub stats: ${error.message}` }
    }
}
