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
        // 1. Fetch Commits from GitHub API (Fetch last 300 commits for better analytics)
        const pages = [1, 2, 3]
        const responses = await Promise.all(
            pages.map(page =>
                fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=100&page=${page}`, {
                    next: { revalidate: 300 }
                })
            )
        )

        const commitsData = (await Promise.all(
            responses.map(async res => {
                if (!res.ok) return []
                return await res.json()
            })
        )).flat()

        const commits: Commit[] = commitsData.map((c: any) => ({
            hash: c.sha,
            date: c.commit.author.date,
            message: c.commit.message,
            author: c.commit.author.name
        }))

        // 2. Fetch Languages (as a proxy for file stats, since ls-files isn't available via simple API without crawling trees)
        // We will map languages to "file types" for the chart
        const languagesResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/languages`, {
            next: { revalidate: 3600 } // Cache for 1 hour
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
                totalFiles: commits.length // API doesn't give total files easily, using commits length as a placeholder or we could omit
            }
        }

    } catch (error: any) {
        console.error('[GitStats] API Error:', error)
        return { success: false, error: `Failed to fetch GitHub stats: ${error.message}` }
    }
}
