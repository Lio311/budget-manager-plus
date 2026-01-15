'use client'

import { useState, useEffect } from 'react'
import { getGitStats, GitStats, Commit } from '@/lib/actions/git'
import { Card } from '@/components/ui/card'
import { Loader2, GitCommit, FileCode, ShieldAlert, Calendar, BarChart3 } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts'
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-100 shadow-xl rounded-lg text-right" dir="rtl">
                <p className="font-bold text-gray-700 mb-1">
                    {format(parseISO(label), 'd בMMMM yyyy', { locale: he })}
                </p>
                <p className="text-sm font-medium" style={{ color: payload[0].fill || payload[0].stroke }}>
                    {`${payload[0].name}: ${payload[0].value}`}
                </p>
            </div>
        )
    }
    return null
}

export function GitAnalytics() {
    const [stats, setStats] = useState<GitStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'YEAR' | 'ALL'>('MONTH')

    useEffect(() => {
        getGitStats().then(res => {
            if (res.success && res.data) {
                setStats(res.data)
            } else {
                setError(res.error || 'Failed to load git stats')
            }
            setLoading(false)
        })
    }, [])

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-blue-500" /></div>
    if (error) return <div className="text-red-500 p-10 text-center">{error}</div>
    if (!stats) return null

    // --- Data Processing for Charts ---

    // 1. Commits over time (aggregated by day)
    const processCommitsByDate = () => {
        const dateMap: { [key: string]: number } = {}
        const now = new Date()
        let startDate = new Date(0) // default all

        if (timeRange === 'WEEK') startDate = subDays(now, 7)
        if (timeRange === 'MONTH') startDate = subDays(now, 30)
        if (timeRange === 'YEAR') startDate = subDays(now, 365)

        stats.commits.forEach(commit => {
            const date = parseISO(commit.date)
            if (date >= startDate) {
                const dateKey = format(date, 'yyyy-MM-dd')
                dateMap[dateKey] = (dateMap[dateKey] || 0) + 1
            }
        })

        const data = Object.entries(dateMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))

        return data
    }

    const commitsData = processCommitsByDate()
    const totalCommitsInRange = commitsData.reduce((acc, curr) => acc + curr.count, 0)

    // 2. Security Commits
    const securityCommits = stats.commits.filter(c =>
        c.message.toLowerCase().includes('security') ||
        c.message.toLowerCase().includes('fix') && c.message.toLowerCase().includes('vuln')
    )

    // 3. File Stats (Top 5 + Others)
    const fileStatsData = (() => {
        const top = stats.fileStats.slice(0, 5)
        const others = stats.fileStats.slice(5).reduce((acc, curr) => acc + curr.value, 0)
        if (others > 0) top.push({ name: 'Others', value: others })
        return top
    })()

    // 4. Commit Types (Feature vs Fix vs Chore vs Other)
    const commitTypeData = (() => {
        const types = {
            'Feature': 0,
            'Fix': 0,
            'Chore': 0,
            'Refactor': 0,
            'Other': 0
        }

        stats.commits.forEach(c => {
            const msg = c.message.toLowerCase()
            if (msg.startsWith('feat') || msg.includes('add') || msg.includes('new') || msg.includes('create')) {
                types['Feature']++
            } else if (msg.startsWith('fix') || msg.includes('bug') || msg.includes('resolve') || msg.includes('repair')) {
                types['Fix']++
            } else if (msg.startsWith('chore') || msg.includes('update') || msg.includes('misc')) {
                types['Chore']++
            } else if (msg.startsWith('refactor') || msg.includes('clean') || msg.includes('improve')) {
                types['Refactor']++
            } else {
                types['Other']++
            }
        })

        return Object.entries(types)
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
    })()

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 flex items-center gap-4 border-l-4 border-blue-500 hover:shadow-lg transition-all">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <GitCommit size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">סה"כ קומיטים</p>
                        <h3 className="text-2xl font-bold">{totalCommitsInRange}</h3>
                    </div>
                </Card>

                <Card className="p-6 flex items-center gap-4 border-l-4 border-red-500 hover:shadow-lg transition-all">
                    <div className="p-3 bg-red-100 rounded-full text-red-600">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">עדכוני אבטחה</p>
                        <h3 className="text-2xl font-bold">{securityCommits.length}</h3>
                    </div>
                </Card>
            </div>

            {/* Time Filter */}
            <div className="flex justify-end gap-2">
                {(['WEEK', 'MONTH', 'YEAR', 'ALL'] as const).map(range => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
                            ${timeRange === range
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border'}`}
                    >
                        {range === 'WEEK' && 'שבוע אחרון'}
                        {range === 'MONTH' && 'חודש אחרון'}
                        {range === 'YEAR' && 'שנה אחרונה'}
                        {range === 'ALL' && 'כל הזמן'}
                    </button>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Commits Bar Chart */}
                <Card className="p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <BarChart3 className="text-blue-500" size={20} />
                            פעילות קומיטים
                        </h3>
                    </div>
                    <div className="h-[300px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={commitsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => format(parseISO(str), 'dd/MM')}
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                />
                                <YAxis stroke="#9CA3AF" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} name="קומיטים" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Commits Area Chart */}
                <Card className="p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Calendar className="text-emerald-500" size={20} />
                            מגמת פעילות
                        </h3>
                    </div>
                    <div className="h-[300px] w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={commitsData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(str) => format(parseISO(str), 'dd/MM')}
                                    stroke="#9CA3AF"
                                    fontSize={12}
                                />
                                <YAxis stroke="#9CA3AF" fontSize={12} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="count" stroke="#10B981" fillOpacity={1} fill="url(#colorCount)" name="קומיטים" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* File Types Pie Chart */}
                <Card className="p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileCode className="text-emerald-500" size={20} />
                            התפלגות שפות (לפי נפח קוד)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full flex items-center justify-center" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={fileStatsData}
                                    cx="50%"
                                    cy="50%"
                                    label
                                    innerRadius={60}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {fileStatsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => (value / 1024).toFixed(1) + ' KB'} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Commit Types Distribution */}
                <Card className="p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <GitCommit className="text-orange-500" size={20} />
                            סוגי קומיטים (Features/Fixes)
                        </h3>
                    </div>
                    <div className="h-[300px] w-full flex items-center justify-center" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={commitTypeData}
                                    cx="50%"
                                    cy="50%"
                                    label
                                    innerRadius={60}
                                    outerRadius={90}
                                    fill="#82ca9d"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {commitTypeData.map((entry, index) => (
                                        <Cell key={`cell-type-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Security Section Filter */}
            <Card className="shadow-lg border-t-4 border-red-500 overflow-hidden">
                <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-700">
                        <ShieldAlert className="h-5 w-5" />
                        <span className="font-bold text-lg">עדכוני אבטחה (Security Logs)</span>
                    </div>
                    <span className="bg-white text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                        {securityCommits.length} נמצאו
                    </span>
                </div>

                <div className="max-h-[300px] overflow-y-auto p-0">
                    {securityCommits.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {securityCommits.map((commit) => (
                                <div key={commit.hash} className="p-4 hover:bg-gray-50 flex items-start gap-3 transition-colors">
                                    <div className="mt-1">
                                        <ShieldAlert size={16} className="text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800 text-sm">{commit.message}</p>
                                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                            <span>{format(parseISO(commit.date), 'dd/MM/yyyy HH:mm')}</span>
                                            <span>•</span>
                                            <span>{commit.author}</span>
                                            <span>•</span>
                                            <span className="font-mono bg-gray-100 px-1 rounded">{commit.hash.substring(0, 7)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            <p>לא נמצאו עדכוני אבטחה.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}
